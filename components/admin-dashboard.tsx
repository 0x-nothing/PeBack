"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adjustUserBalance,
  createProduct,
  getOrders,
  getProducts,
  getUsers,
  getWithdrawals,
  markWithdrawalStatus,
  reviewOrder
} from "@/lib/firebase-collections";
import { auth } from "@/lib/firebase";
import { loadSession } from "@/lib/session";
import { StatusChip } from "@/components/status-chip";
import { AppUser, DashboardStats, Order, Product, WithdrawalRequest } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const emptyProductForm = {
  name: "",
  category: "",
  imageUrl: "",
  price: "",
  commissionPercent: "",
  affiliateLink: "",
  description: ""
};

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categorySelection, setCategorySelection] = useState("");
  const [balanceEditor, setBalanceEditor] = useState<Record<string, string>>({});
  const [orderProductEditor, setOrderProductEditor] = useState<Record<string, string>>({});
  const [orderKeyword, setOrderKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  async function loadData() {
    setLoading(true);
    await auth.authStateReady();
    const [productList, orderList, userList, withdrawalList] = await Promise.all([
      getProducts(),
      getOrders(),
      getUsers(),
      getWithdrawals()
    ]);

    setProducts(productList);
    setOrders(orderList);
    setUsers(userList.filter((item) => item.role === "user"));
    setWithdrawals(withdrawalList);
    setLoading(false);
  }

  useEffect(() => {
    const session = loadSession();
    const isAdmin = session?.role === "admin";
    setCanAccess(isAdmin);

    if (isAdmin) {
      void loadData();
      return;
    }

    setLoading(false);
  }, []);

  const stats = useMemo<DashboardStats>(() => {
    return {
      totalProducts: products.length,
      processingOrders: orders.filter((item) => item.status === "processing").length,
      completedOrders: orders.filter((item) => item.status === "completed").length,
      pendingWithdrawals: withdrawals.filter((item) => item.status === "pending").length,
      totalPaidWithdrawalsAmount: withdrawals
        .filter((item) => item.status === "paid")
        .reduce((total, item) => total + item.amount, 0),
      totalBalance: users.reduce((total, user) => total + user.balance, 0)
    };
  }, [orders, products.length, users, withdrawals]);

  const existingCategories = useMemo(() => {
    return [...new Set(products.map((item) => item.category.trim()).filter(Boolean))].sort((left, right) =>
      left.localeCompare(right, "vi")
    );
  }, [products]);

  const draftCategory = productForm.category.trim();
  const selectedCategory = categorySelection.trim();
  const resolvedCategoryLabel = draftCategory || selectedCategory;

  const queueOrders = useMemo(() => {
    const normalized = orderKeyword.trim().toLowerCase();
    const sortedOrders = [...orders].sort((left, right) => {
      if (left.status === "processing" && right.status !== "processing") return -1;
      if (left.status !== "processing" && right.status === "processing") return 1;
      return right.submittedAt.localeCompare(left.submittedAt);
    });

    if (!normalized) return sortedOrders;

    return sortedOrders.filter((order) => {
      return (
        order.orderCode.toLowerCase().includes(normalized) ||
        order.username.toLowerCase().includes(normalized) ||
        order.productName.toLowerCase().includes(normalized)
      );
    });
  }, [orders, orderKeyword]);

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resolvedCategory = draftCategory || selectedCategory;
    const price = Number(productForm.price);
    const commissionPercent = Number(productForm.commissionPercent);
    const commissionValue = Math.round((price * commissionPercent) / 100);

    if (!resolvedCategory) {
      setMessage("Hãy chọn danh mục có sẵn hoặc nhập danh mục mới.");
      return;
    }

    const product: Product = {
      id: `p-${crypto.randomUUID()}`,
      name: productForm.name.trim(),
      category: resolvedCategory,
      imageUrl: productForm.imageUrl.trim(),
      price,
      commissionPercent,
      commissionValue,
      affiliateLink: productForm.affiliateLink.trim(),
      description: productForm.description.trim(),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await createProduct(product);
    setProductForm(emptyProductForm);
    setCategorySelection("");
    setMessage("Đã thêm sản phẩm mới.");
    await loadData();
  }

  async function handleReview(order: Order, status: "completed" | "rejected") {
    if (order.status !== "processing") {
      setMessage("Chỉ có thể xử lý đơn đang ở trạng thái Đang xử lý.");
      return;
    }

    const selectedProductId = orderProductEditor[order.id] ?? order.productId;
    const selectedProduct = products.find((item) => item.id === selectedProductId) ?? null;

    if (status === "completed" && !selectedProduct && !order.productId) {
      setMessage("Hãy gắn sản phẩm cho đơn trước khi xác nhận hoàn thành.");
      return;
    }

    await reviewOrder(order.id, order.userId, status, status === "completed" ? selectedProduct : null);
    setMessage(status === "completed" ? "Đơn hàng đã được xác nhận và cộng số dư." : "Đơn hàng đã bị từ chối.");
    await loadData();
  }

  async function handleBalanceUpdate(userId: string) {
    const nextBalance = Number(balanceEditor[userId]);
    if (Number.isNaN(nextBalance)) {
      setMessage("Số dư mới không hợp lệ.");
      return;
    }

    await adjustUserBalance(userId, nextBalance);
    setMessage("Đã cập nhật số dư user.");
    await loadData();
  }

  async function handleWithdrawalAction(withdrawalId: string, status: WithdrawalRequest["status"]) {
    if (status !== "paid" && status !== "cancelled") {
      setMessage("Trạng thái rút tiền không hợp lệ.");
      return;
    }

    const item = withdrawals.find((entry) => entry.id === withdrawalId);
    if (!item) {
      setMessage("Không tìm thấy yêu cầu rút tiền.");
      return;
    }

    await markWithdrawalStatus(withdrawalId, item.userId, item.amount, status);
    setMessage(status === "paid" ? "Đã đánh dấu yêu cầu rút tiền là đã thanh toán." : "Đã hủy yêu cầu rút tiền.");
    await loadData();
  }

  if (loading) {
    return <div className="page-shell section">Đang tải admin dashboard...</div>;
  }

  if (!canAccess) {
    return (
      <main className="page-shell page-stack">
        <section className="section">
          <div className="hero-card hero-card--admin-lock stack">
            <span className="badge">Admin dashboard</span>
            <h1 className="section-title">Tài khoản này chưa có quyền quản trị</h1>
            <p className="section-copy">
              Bạn cần đăng nhập bằng tài khoản có role admin trong Firestore mới vào được khu quản trị.
            </p>
            <p className="note">
              Bản miễn phí này vẫn an toàn ở mức hợp lý: chỉ admin mới thêm sản phẩm, duyệt đơn và xử lý rút tiền.
            </p>
            <Link href="/" className="button">
              Về trang user
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell page-stack page-stack--admin">
      <section className="store-hero store-hero--admin">
        <div className="hero-card hero-card--store">
          <span className="badge">Khu quản trị nội bộ</span>
          <h1>Quản lý sản phẩm, duyệt đúng đơn đã mua và xử lý số dư trong một màn hình gọn.</h1>
          <p>
            User giờ gửi mã đơn ngay tại từng sản phẩm. Ở đây admin chủ yếu xác nhận đơn đúng sản phẩm đã mua,
            và vẫn có thể đổi sản phẩm nếu cần để giữ luồng duyệt linh hoạt.
          </p>
          <div className="hero-pill-list">
            <div className="metric-pill">
              <span>Sản phẩm</span>
              <strong>{stats.totalProducts}</strong>
            </div>
            <div className="metric-pill">
              <span>Đơn đang xử lý</span>
              <strong>{stats.processingOrders}</strong>
            </div>
            <div className="metric-pill">
              <span>Tổng số tiền đã rút</span>
              <strong>{formatCurrency(stats.totalPaidWithdrawalsAmount)}</strong>
            </div>
            <div className="metric-pill">
              <span>Tổng số dư user</span>
              <strong>{formatCurrency(stats.totalBalance)}</strong>
            </div>
          </div>
        </div>

        <div className="store-hero__side">
          <div className="hero-card hero-card--summary">
            <div className="panel-kicker">Tác vụ ưu tiên</div>
            <div className="summary-metrics summary-metrics--panel">
              <div>
                <span>Cần confirm</span>
                <strong>{stats.processingOrders}</strong>
              </div>
              <div>
                <span>Cần chi trả</span>
                <strong>{stats.pendingWithdrawals}</strong>
              </div>
              <div>
                <span>User có số dư</span>
                <strong>{users.filter((item) => item.balance > 0).length}</strong>
              </div>
            </div>
            <Link href="/" className="button-ghost button-ghost--compact">
              Về web user
            </Link>
          </div>
        </div>
      </section>

      {message ? <div className="alert-banner">{message}</div> : null}

      <section className="section section--tight">
        <div className="stats-grid stats-grid--dense">
          <div className="card stat-card stat-card--accent">
            <div className="stat-label">Tổng sản phẩm</div>
            <div className="stat-value">{stats.totalProducts}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Đơn đang xử lý</div>
            <div className="stat-value">{stats.processingOrders}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Đơn hoàn thành</div>
            <div className="stat-value">{stats.completedOrders}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Tổng số tiền đã rút</div>
            <div className="stat-value">{formatCurrency(stats.totalPaidWithdrawalsAmount)}</div>
          </div>
        </div>
      </section>

      <section className="section admin-workspace">
        <form className="panel stack" onSubmit={handleCreateProduct}>
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Thêm sản phẩm</div>
              <h2>Đẩy sản phẩm lên web user</h2>
            </div>
            <div className="section-tag">Tự động tính hoa hồng</div>
          </div>
          <div className="form-grid">
            <input
              className="field"
              placeholder="Tên sản phẩm"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <div className="stack">
              <div className="panel-kicker">Danh mục có sẵn</div>
              <select
                className="select"
                value={categorySelection}
                onChange={(event) => setCategorySelection(event.target.value)}
              >
                <option value="">Chọn danh mục đã có</option>
                {existingCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="stack">
              <div className="panel-kicker">Hoặc thêm danh mục mới</div>
              <input
                className="field"
                placeholder="Nhập danh mục mới"
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
              />
            </div>
            <div className="note full">
              {resolvedCategoryLabel
                ? `Danh mục sẽ lưu: ${resolvedCategoryLabel}`
                : "Bạn có thể chọn danh mục đã có hoặc nhập một danh mục mới."}
            </div>
            <input
              className="field full"
              placeholder="Link ảnh sản phẩm"
              value={productForm.imageUrl}
              onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
            <input
              className="field"
              type="number"
              placeholder="Giá"
              value={productForm.price}
              onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
            />
            <input
              className="field"
              type="number"
              placeholder="% hoa hồng"
              value={productForm.commissionPercent}
              onChange={(event) => setProductForm((prev) => ({ ...prev, commissionPercent: event.target.value }))}
            />
            <input
              className="field full"
              placeholder="Affiliate link Shopee"
              value={productForm.affiliateLink}
              onChange={(event) => setProductForm((prev) => ({ ...prev, affiliateLink: event.target.value }))}
            />
            <textarea
              className="textarea full"
              placeholder="Mô tả ngắn sản phẩm"
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <button className="button" type="submit">
            Thêm sản phẩm vào web user
          </button>
        </form>

        <div className="panel stack">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Preview trên web user</div>
              <h2>Ô sản phẩm đang hiển thị</h2>
            </div>
            <div className="section-tag">{products.length} sản phẩm</div>
          </div>

          {products.length ? (
            <div className="product-grid product-grid--shop product-grid--admin">
              {products.slice(0, 8).map((product) => (
                <article className="shop-card shop-card--admin" key={product.id}>
                  <div className="shop-card__image-wrap">
                    <div className="shop-card__image shop-card__image--small">
                      {product.imageUrl.trim() ? (
                        <img alt={product.name} src={product.imageUrl} />
                      ) : (
                        <div className="shop-card__image-placeholder">Chưa có ảnh</div>
                      )}
                    </div>
                  </div>
                  <div className="shop-card__body">
                    <div className="shop-card__badges">
                      <span className="badge badge--compact">{product.category}</span>
                    </div>
                    <h3 className="shop-card__title">{product.name}</h3>
                    <div className="price price--shop">{formatCurrency(product.price)}</div>
                    <div className="mini-chip mini-chip--accent">
                      {product.commissionPercent}% / {formatCurrency(product.commissionValue)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">Chưa có sản phẩm nào để hiển thị.</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="panel panel--table">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Hàng đợi xử lý</div>
              <h2>Duyệt đơn hàng thủ công</h2>
            </div>
            <div className="panel-tools">
              <input
                className="field"
                placeholder="Tìm mã đơn hoặc username"
                value={orderKeyword}
                onChange={(event) => setOrderKeyword(event.target.value)}
              />
              <div className="section-tag">{queueOrders.length}/{orders.length} đơn</div>
            </div>
          </div>
          {queueOrders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Tài khoản</th>
                    <th>Sản phẩm</th>
                    <th>Hoa hồng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {queueOrders.map((order) => {
                  const selectedProductId = orderProductEditor[order.id] ?? order.productId;
                  const selectedProduct = products.find((item) => item.id === selectedProductId) ?? null;
                  const shownProductName = selectedProduct?.name ?? order.productName;
                  const shownCommission = selectedProduct?.commissionValue ?? order.commissionValue;

                    return (
                      <tr key={order.id}>
                        <td data-label="Mã đơn">
                          <strong>{order.orderCode}</strong>
                          <div className="note">{formatDate(order.submittedAt)}</div>
                        </td>
                        <td data-label="Tài khoản">{order.username}</td>
                        <td data-label="Sản phẩm">
                          <div className="action-stack">
                            <select
                              className="select"
                              value={selectedProductId}
                              onChange={(event) =>
                                setOrderProductEditor((prev) => ({ ...prev, [order.id]: event.target.value }))
                              }
                            >
                              <option value="">Chọn hoặc đổi sản phẩm</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                            <div className="note">{shownProductName || "Chưa gắn sản phẩm"}</div>
                          </div>
                        </td>
                        <td data-label="Hoa hồng">{shownCommission ? formatCurrency(shownCommission) : "Chưa xác định"}</td>
                        <td data-label="Trạng thái">
                          <StatusChip status={order.status} />
                        </td>
                        <td data-label="Thao tác">
                          <div className="action-stack">
                            <button
                              className="button button--compact"
                              type="button"
                              disabled={order.status !== "processing"}
                              onClick={() => void handleReview(order, "completed")}
                            >
                              Confirm
                            </button>
                            <button
                              className="button-ghost button-ghost--compact"
                              type="button"
                              disabled={order.status !== "processing"}
                              onClick={() => void handleReview(order, "rejected")}
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Không tìm thấy đơn nào khớp từ khóa hiện tại.</div>
          )}
        </div>
      </section>

      <section className="section dashboard-panels dashboard-panels--wide">
        <div className="panel panel--table">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Quản lý user</div>
              <h2>Số dư và tài khoản ngân hàng</h2>
            </div>
            <div className="section-tag">{users.length} user</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Số dư</th>
                  <th>Ngân hàng</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Username">{user.username}</td>
                    <td data-label="Số dư">{formatCurrency(user.balance)}</td>
                    <td data-label="Ngân hàng">
                      {user.linkedBank ? (
                        <>
                          <strong>{user.linkedBank.bankName}</strong>
                          <div className="note">{user.linkedBank.accountNumber}</div>
                        </>
                      ) : (
                        <span className="muted">Chưa liên kết</span>
                      )}
                    </td>
                    <td data-label="Cập nhật">
                      <div className="action-stack">
                        <input
                          className="field"
                          type="number"
                          placeholder="Nhập số dư mới"
                          value={balanceEditor[user.id] ?? ""}
                          onChange={(event) =>
                            setBalanceEditor((prev) => ({ ...prev, [user.id]: event.target.value }))
                          }
                        />
                        <button className="button-muted button-muted--compact" type="button" onClick={() => void handleBalanceUpdate(user.id)}>
                          Lưu số dư
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel panel--table">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Chi trả</div>
              <h2>Yêu cầu rút tiền</h2>
            </div>
            <div className="section-tag">{withdrawals.length} yêu cầu</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Số tiền</th>
                  <th>Ngân hàng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((item) => (
                  <tr key={item.id}>
                    <td data-label="User">
                      <strong>{item.username}</strong>
                      <div className="note">{formatDate(item.requestedAt)}</div>
                    </td>
                    <td data-label="Số tiền">{formatCurrency(item.amount)}</td>
                    <td data-label="Ngân hàng">
                      {item.bankName}
                      <div className="note">{item.accountNumber}</div>
                    </td>
                    <td data-label="Trạng thái">
                      <StatusChip status={item.status} />
                    </td>
                    <td data-label="Thao tác">
                      <div className="action-stack">
                        <button
                          className="button button--compact"
                          type="button"
                          disabled={item.status === "paid"}
                          onClick={() => void handleWithdrawalAction(item.id, "paid")}
                        >
                          Đã trả tiền
                        </button>
                        <button
                          className="button-ghost button-ghost--compact"
                          type="button"
                          disabled={item.status === "cancelled"}
                          onClick={() => void handleWithdrawalAction(item.id, "cancelled")}
                        >
                          Hủy
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

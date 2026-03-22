"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createOrder,
  createWithdrawal,
  getOrdersForUser,
  getProducts,
  getUserProfile,
  getWithdrawalsForUser,
  updateUserBank
} from "@/lib/firebase-collections";
import { auth, initAnalytics } from "@/lib/firebase";
import { loginWithUsername, logoutCurrentUser, registerWithUsername } from "@/lib/auth";
import { clearSession, loadSession, saveSession, SessionState } from "@/lib/session";
import { AppUser, Order, Product, WithdrawalRequest } from "@/lib/types";
import { formatCurrency, formatDate, passwordIsValid, usernameIsValid } from "@/lib/utils";
import { StatusChip } from "@/components/status-chip";
import { Topbar } from "@/components/topbar";

const emptyBankForm = {
  bankName: "",
  accountNumber: "",
  accountHolder: ""
};

export function UserDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "" });
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [bankForm, setBankForm] = useState(emptyBankForm);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const productList = await getProducts();
    setProducts(productList.filter((item) => item.isActive));

    const activeSession = loadSession();
    setSession(activeSession);

    if (activeSession) {
      await auth.authStateReady();
      const [profile, orderList, withdrawalList] = await Promise.all([
        getUserProfile(activeSession.userId),
        getOrdersForUser(activeSession.userId),
        getWithdrawalsForUser(activeSession.userId)
      ]);

      setCurrentUser(profile);
      setOrders(orderList);
      setWithdrawals(withdrawalList);
    } else {
      setCurrentUser(null);
      setOrders([]);
      setWithdrawals([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void) => number;
      };
      const startAnalytics = () => {
        void initAnalytics();
      };

      if (typeof idleWindow.requestIdleCallback === "function") {
        idleWindow.requestIdleCallback(startAnalytics);
      } else {
        window.setTimeout(startAnalytics, 1200);
      }
    }

    void loadData();
  }, []);

  const categories = useMemo(() => {
    return ["Tất cả", ...new Set(products.map((item) => item.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      return selectedCategory === "Tất cả" || item.category === selectedCategory;
    });
  }, [products, selectedCategory]);

  const pendingOrders = orders.filter((item) => item.status === "processing").length;
  const completedOrders = orders.filter((item) => item.status === "completed").length;
  const pendingWithdrawals = withdrawals.filter((item) => item.status === "pending").length;
  const totalPaidWithdrawalsAmount = withdrawals
    .filter((item) => item.status === "paid")
    .reduce((total, item) => total + item.amount, 0);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usernameIsValid(registerForm.username)) {
      setMessage("Tên tài khoản phải dài hơn 6 ký tự.");
      return;
    }

    if (!passwordIsValid(registerForm.password)) {
      setMessage("Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }

    try {
      const user = await registerWithUsername(registerForm.username.trim(), registerForm.password);
      saveSession({ userId: user.id, username: user.username, role: user.role });
      setSession({ userId: user.id, username: user.username, role: user.role });
      setRegisterForm({ username: "", password: "" });
      setMessage("Đăng ký thành công. Mật khẩu đã được Firebase Auth lưu an toàn hơn Firestore.");
      await loadData();
    } catch {
      setMessage("Đăng ký thất bại. Hãy kiểm tra xem Firebase Auth đã bật Email/Password chưa.");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const user = await loginWithUsername(loginForm.username.trim(), loginForm.password);
      saveSession({ userId: user.id, username: user.username, role: user.role });
      setSession({ userId: user.id, username: user.username, role: user.role });
      setLoginForm({ username: "", password: "" });
      setMessage("Đăng nhập thành công.");
      await loadData();
    } catch {
      setMessage("Sai tài khoản hoặc mật khẩu, hoặc chưa bật Email/Password trong Firebase Auth.");
    }
  }

  async function handleLogout() {
    await logoutCurrentUser();
    clearSession();
    setSession(null);
    setMessage("Đã đăng xuất.");
  }

  async function handleSubmitOrder(event: FormEvent<HTMLFormElement>, product: Product) {
    event.preventDefault();

    if (!currentUser) {
      setMessage("Cần đăng nhập để gửi mã đơn hàng.");
      return;
    }

    const orderCode = (orderDrafts[product.id] ?? "").trim();
    if (!orderCode) {
      setMessage("Hãy nhập mã đơn hàng trước khi gửi.");
      return;
    }

    const order: Order = {
      id: `o-${crypto.randomUUID()}`,
      orderCode,
      userId: currentUser.id,
      username: currentUser.username,
      productId: product.id,
      productName: product.name,
      affiliateLink: product.affiliateLink,
      commissionValue: product.commissionValue,
      status: "processing",
      submittedAt: new Date().toISOString()
    };

    await createOrder(order);
    setOrderDrafts((prev) => ({ ...prev, [product.id]: "" }));
    setMessage(`Đã gửi mã đơn cho ${product.name}. Khi duyệt xong, tiền hoàn sẽ cộng đúng vào đơn này.`);
    await loadData();
  }

  async function handleBankSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setMessage("Cần đăng nhập để liên kết ngân hàng.");
      return;
    }

    if (currentUser.linkedBank) {
      setMessage("Mỗi tài khoản chỉ được liên kết ngân hàng 1 lần.");
      return;
    }

    const linkedBank = {
      ...bankForm,
      linkedAt: new Date().toISOString()
    };

    await updateUserBank(currentUser.id, linkedBank);
    setBankForm(emptyBankForm);
    setMessage("Đã lưu thông tin ngân hàng.");
    await loadData();
  }

  async function handleWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setMessage("Cần đăng nhập để tạo yêu cầu rút tiền.");
      return;
    }

    if (!currentUser.linkedBank) {
      setMessage("Bạn cần liên kết ngân hàng trước khi rút tiền.");
      return;
    }

    const amount = Number(withdrawAmount);
    if (!amount || amount < 50000) {
      setMessage("Số tiền rút tối thiểu là 50.000 VND.");
      return;
    }

    if (amount > currentUser.balance) {
      setMessage("Số dư hiện tại không đủ để rút.");
      return;
    }

    const request: WithdrawalRequest = {
      id: `w-${crypto.randomUUID()}`,
      userId: currentUser.id,
      username: currentUser.username,
      amount,
      bankName: currentUser.linkedBank.bankName,
      accountNumber: currentUser.linkedBank.accountNumber,
      accountHolder: currentUser.linkedBank.accountHolder,
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    await createWithdrawal(request);
    setWithdrawAmount("");
    setMessage("Đã gửi yêu cầu rút tiền.");
    await loadData();
  }

  if (loading) {
    return <div className="page-shell section">Đang tải dữ liệu...</div>;
  }

  return (
    <>
      <Topbar session={session} onLogout={() => void handleLogout()} />

      <main className="page-shell page-stack">
        <section className="store-hero">
          <div className="hero-card hero-card--store">
            <span className="badge">Sản phẩm affiliate có hoa hồng rõ ràng</span>
            <h1>HOÀN TIỀN VỚI PEBACK GIÚP TIẾT KIỆM CHI PHÍ KHI MUA SẮM</h1>
            <p>* WEB CHIA SẺ DOANH THU HOA HỒNG QUA SHOPPE TIẾP THỊ LIÊN KẾT</p>

            <div className="hero-pill-list">
              <div className="metric-pill">
                <span>Sản phẩm đang mở</span>
                <strong>{products.length}</strong>
              </div>
              <div className="metric-pill">
                <span>Đơn đang xử lý</span>
                <strong>{pendingOrders}</strong>
              </div>
              <div className="metric-pill">
                <span>Đơn đã hoàn thành</span>
                <strong>{completedOrders}</strong>
              </div>
              <div className="metric-pill">
                <span>Tổng số tiền đã rút</span>
                <strong>{formatCurrency(totalPaidWithdrawalsAmount)}</strong>
              </div>
            </div>
          </div>

          <div className="store-hero__side">
            <div className="hero-card hero-card--summary">
              <div className="panel-kicker">Tài khoản hiện tại</div>
              <div className="summary-name">{currentUser ? currentUser.username : "Chưa đăng nhập"}</div>
              <div className="summary-metrics">
                <div>
                  <span>Số dư khả dụng</span>
                  <strong>{formatCurrency(currentUser?.balance ?? 0)}</strong>
                </div>
                <div>
                  <span>Ngân hàng</span>
                  <strong>{currentUser?.linkedBank?.bankName ?? "Chưa liên kết"}</strong>
                </div>
                <div>
                  <span>Rút tối thiểu</span>
                  <strong>50.000 VND</strong>
                </div>
              </div>
              <a className="button button--compact" href={session ? "#orders" : "#auth"}>
                {session ? "Xem đơn của bạn" : "Đăng ký"}
              </a>
            </div>

            <div className="hero-card hero-card--tips">
              <div className="panel-kicker">3 bước nhận hoa hồng</div>
              <ol className="tips-list">
                <li>Chọn sản phẩm và bấm Mua ngay.</li>
                <li>Sau khi đặt hàng, vào mục Gửi mã đơn và điền đúng mã đơn Shopee.</li>
                <li>Đơn sẽ được xác nhận sau khi đơn hoàn thành và cộng số dư vào tài khoản của bạn.</li>
              </ol>
            </div>
          </div>
        </section>

        {message ? (
          <section className="section section--tight">
            <div className="alert-banner">{message}</div>
          </section>
        ) : null}

        {!session ? (
          <section className="section" id="auth">
            <div className="hero-card hero-card--auth stack">
              <span className="badge">Đăng ký</span>
              <h2 className="section-title">Đăng ký</h2>
              <p className="section-copy">Tạo tài khoản để bắt đầu dùng PeBack.</p>

              {authMode === "register" ? (
                <form className="auth-form stack" onSubmit={handleRegister}>
                  <input
                    className="field"
                    placeholder="Tên tài khoản trên 6 ký tự"
                    value={registerForm.username}
                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
                  />
                  <input
                    className="field"
                    placeholder="Mật khẩu mạnh"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                  <div className="note">Ví dụ hợp lệ: Peback@123</div>
                  <button className="button" type="submit">
                    Đăng ký
                  </button>
                </form>
              ) : (
                <form className="auth-form stack" onSubmit={handleLogin}>
                  <input
                    className="field"
                    placeholder="Tên tài khoản"
                    value={loginForm.username}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
                  />
                  <input
                    className="field"
                    placeholder="Mật khẩu"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                  <button className="button-muted" type="submit">
                    Đăng nhập tài khoản cũ
                  </button>
                </form>
              )}

              <div className="auth-switch">
                {authMode === "register" ? (
                  <>
                    <span>Đã có tài khoản?</span>
                    <button className="button-ghost button-ghost--compact" type="button" onClick={() => setAuthMode("login")}>
                      Chuyển sang đăng nhập
                    </button>
                  </>
                ) : (
                  <>
                    <span>Chưa có tài khoản?</span>
                    <button className="button-ghost button-ghost--compact" type="button" onClick={() => setAuthMode("register")}>
                      Chuyển sang đăng ký
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="section" id="products">
          <div className="section-head">
            <div>
              <h2 className="section-title">Sản phẩm hoa hồng</h2>
              <p className="section-copy">Mỗi sản phẩm có ô gửi mã đơn riêng để hệ thống gắn hoa hồng đúng đơn đã mua.</p>
            </div>
          </div>

          <div className="category-toolbar">
            <label className="category-select-wrap">
              <span className="panel-kicker">Chọn danh mục</span>
              <select
                className="select category-select"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <div className="section-tag">{filteredProducts.length} kết quả</div>
          </div>

          <div className="chip-row" role="tablist" aria-label="Danh mục sản phẩm">
            {categories.map((category) => (
              <button
                key={category}
                className={category === selectedCategory ? "chip-button chip-button--active" : "chip-button"}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="product-grid product-grid--shop">
            {filteredProducts.length ? (
              filteredProducts.map((product) => (
                <article className="shop-card" key={product.id}>
                  <div className="shop-card__image-wrap">
                    <div className="shop-card__image">
                      {product.imageUrl.trim() ? (
                        <Image
                          alt={product.name}
                          src={product.imageUrl}
                          width={720}
                          height={720}
                          sizes="(max-width: 620px) 44vw, (max-width: 860px) 30vw, 220px"
                        />
                      ) : (
                        <div className="shop-card__image-placeholder">Chưa có ảnh</div>
                      )}
                    </div>
                  </div>

                  <div className="shop-card__body">
                    <div className="shop-card__badges">
                      <span className="badge badge--compact">{product.category}</span>
                      <span className="mini-chip">{product.commissionPercent}% hoa hồng</span>
                    </div>
                    <h3 className="shop-card__title">{product.name}</h3>
                    <p className="shop-card__desc">
                      {product.description || "Sản phẩm đã được cấu hình sẵn giá, hoa hồng và link mua nhanh."}
                    </p>
                    <div className="shop-card__price-row">
                      <div>
                        <div className="mini-label">Giá sản phẩm</div>
                        <div className="price price--shop">{formatCurrency(product.price)}</div>
                      </div>
                      <div className="cashback-box">
                        <span>Bạn nhận</span>
                        <strong>{formatCurrency(product.commissionValue)}</strong>
                      </div>
                    </div>
                    <div className="shop-card__footer">
                      <a className="button button--compact" href={product.affiliateLink} target="_blank" rel="noreferrer">
                        Mua ngay
                      </a>
                    </div>
                    {session ? (
                      <form className="stack" onSubmit={(event) => void handleSubmitOrder(event, product)}>
                        <input
                          className="field"
                          placeholder="Nhập mã đơn Shopee"
                          value={orderDrafts[product.id] ?? ""}
                          onChange={(event) =>
                            setOrderDrafts((prev) => ({ ...prev, [product.id]: event.target.value }))
                          }
                        />
                        <button className="button-ghost button-ghost--compact" type="submit">
                          Gửi mã đơn sản phẩm này
                        </button>
                      </form>
                    ) : (
                      <a className="button-ghost button-ghost--compact" href="#auth">
                        Đăng ký để gửi mã đơn
                      </a>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty empty--wide">Không có sản phẩm nào khớp bộ lọc hiện tại.</div>
            )}
          </div>
        </section>

        <section className="section" id="orders">
          <div className="section-head">
            <div>
              <h2 className="section-title">Đơn của bạn</h2>
              <p className="section-copy">Gửi mã đơn trực tiếp ở từng sản phẩm. Khu này dùng để theo dõi trạng thái duyệt.</p>
            </div>
          </div>

          <div className="dashboard-panels dashboard-panels--wide">
            <div className="panel stack">
              <div className="panel-kicker">Cách gửi mã đơn</div>
              <h3>Gửi ngay trên từng sản phẩm</h3>
              <div className="summary-metrics summary-metrics--panel">
                <div>
                  <span>Bước 1</span>
                  <strong>Bấm Mua ngay</strong>
                </div>
                <div>
                  <span>Bước 2</span>
                  <strong>Quay lại đúng sản phẩm</strong>
                </div>
                <div>
                  <span>Bước 3</span>
                  <strong>Nhập mã đơn để duyệt</strong>
                </div>
              </div>
              <div className="note">Vui lòng điền đúng mã đơn.</div>
            </div>

            <div className="panel panel--table">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">Lịch sử đơn hàng</div>
                  <h3>Đơn của bạn</h3>
                </div>
                <div className="section-tag">{orders.length} đơn</div>
              </div>
              {orders.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Sản phẩm</th>
                        <th>Hoa hồng</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td data-label="Mã đơn">
                            <strong>{order.orderCode}</strong>
                            <div className="note">{formatDate(order.submittedAt)}</div>
                          </td>
                          <td data-label="Sản phẩm">{order.productName || "Chưa gắn sản phẩm"}</td>
                          <td data-label="Hoa hồng">{order.commissionValue ? formatCurrency(order.commissionValue) : "Đang chờ duyệt"}</td>
                          <td data-label="Trạng thái">
                            <StatusChip status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">Chưa có đơn hàng nào.</div>
              )}
            </div>
          </div>
        </section>

        <section className="section" id="withdrawals">
          <div className="section-head">
            <div>
              <h2 className="section-title">{currentUser?.linkedBank ? "Rút tiền" : "Rút tiền và liên kết ngân hàng"}</h2>
            </div>
          </div>

          <div className={currentUser?.linkedBank ? "dashboard-panels" : "dashboard-panels dashboard-panels--wide"}>
            {currentUser?.linkedBank ? null : (
              <form className="panel stack" onSubmit={handleBankSubmit}>
                <div className="panel-kicker">Liên kết ngân hàng</div>
                <h3>Mỗi tài khoản chỉ liên kết 1 lần</h3>
                <input
                  className="field"
                  placeholder="Tên ngân hàng"
                  value={bankForm.bankName}
                  onChange={(event) => setBankForm((prev) => ({ ...prev, bankName: event.target.value }))}
                />
                <input
                  className="field"
                  placeholder="Số tài khoản"
                  value={bankForm.accountNumber}
                  onChange={(event) => setBankForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
                />
                <input
                  className="field"
                  placeholder="Tên chủ tài khoản"
                  value={bankForm.accountHolder}
                  onChange={(event) => setBankForm((prev) => ({ ...prev, accountHolder: event.target.value }))}
                />
                <button className="button-muted" type="submit">
                  Lưu thông tin ngân hàng
                </button>
              </form>
            )}

            <div className="panel stack">
              <div className="panel-kicker">Rút tiền</div>
              <h3>Gửi yêu cầu và theo dõi trạng thái</h3>
              <form className="stack" onSubmit={handleWithdrawal}>
                <input
                  className="field"
                  type="number"
                  min={50000}
                  placeholder="Số tiền cần rút"
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                />
                <div className="summary-strip">
                  <div>
                    <span>Số dư hiện tại</span>
                    <strong>{formatCurrency(currentUser?.balance ?? 0)}</strong>
                  </div>
                  <div>
                    <span>Mức tối thiểu</span>
                    <strong>50.000 VND</strong>
                  </div>
                </div>
                <button className="button" type="submit">
                  Gửi yêu cầu rút
                </button>
              </form>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Số tiền</th>
                      <th>Ngân hàng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length ? (
                      withdrawals.map((item) => (
                        <tr key={item.id}>
                          <td data-label="Số tiền">
                            <strong>{formatCurrency(item.amount)}</strong>
                            <div className="note">{formatDate(item.requestedAt)}</div>
                          </td>
                          <td data-label="Ngân hàng">{item.bankName}</td>
                          <td data-label="Trạng thái">
                            <StatusChip status={item.status} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>Chưa có yêu cầu rút tiền.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

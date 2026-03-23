import {
  getDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, Order, Product, WithdrawalRequest } from "@/lib/types";

const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");
const withdrawalsCollection = collection(db, "withdrawals");

function docsToArray<T>(snapshot: Awaited<ReturnType<typeof getDocs>>) {
  return snapshot.docs.map((entry) => entry.data() as T);
}

export async function getProducts() {
  const snapshot = await getDocs(productsCollection);
  return docsToArray<Product>(snapshot);
}

export async function getUsers() {
  const snapshot = await getDocs(usersCollection);
  return docsToArray<AppUser>(snapshot);
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists() ? (snapshot.data() as AppUser) : null;
}

export async function getOrders() {
  const snapshot = await getDocs(ordersCollection);
  return docsToArray<Order>(snapshot);
}

export async function getOrdersForUser(userId: string) {
  const snapshot = await getDocs(query(ordersCollection, where("userId", "==", userId)));
  return docsToArray<Order>(snapshot);
}

export async function getWithdrawals() {
  const snapshot = await getDocs(withdrawalsCollection);
  return docsToArray<WithdrawalRequest>(snapshot);
}

export async function getWithdrawalsForUser(userId: string) {
  const snapshot = await getDocs(query(withdrawalsCollection, where("userId", "==", userId)));
  return docsToArray<WithdrawalRequest>(snapshot);
}

export async function createProduct(product: Product) {
  await setDoc(doc(db, "products", product.id), product);
}

export async function createUser(user: AppUser) {
  await setDoc(doc(db, "users", user.id), user);
}

export async function createOrder(order: Order) {
  await setDoc(doc(db, "orders", order.id), {
    ...order,
    reviewedAt: null
  });
}

export async function createWithdrawal(withdrawal: WithdrawalRequest) {
  await setDoc(doc(db, "withdrawals", withdrawal.id), withdrawal);
}

export async function updateUserBank(userId: string, linkedBank: AppUser["linkedBank"]) {
  await updateDoc(doc(db, "users", userId), {
    linkedBank
  });
}

export async function reviewOrder(
  orderId: string,
  userId: string,
  status: "completed" | "rejected",
  product?: Product | null
) {
  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, "orders", orderId);
    const userRef = doc(db, "users", userId);

    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error("Không tìm thấy đơn hàng.");
    }

    const order = orderSnapshot.data() as Order;
    if (order.status !== "processing") {
      throw new Error("Đơn hàng không còn ở trạng thái đang xử lý.");
    }

    const finalProductId = product?.id ?? order.productId;
    const finalProductName = product?.name ?? order.productName;
    const finalAffiliateLink = product?.affiliateLink ?? order.affiliateLink;
    const finalCommissionValue = product?.commissionValue ?? order.commissionValue;

    if (status === "completed") {
      if (!finalProductId || !finalProductName || !finalCommissionValue) {
        throw new Error("Cần gắn sản phẩm trước khi xác nhận hoàn thành đơn.");
      }

      transaction.update(userRef, {
        balance: increment(finalCommissionValue)
      });
    }

    transaction.update(orderRef, {
      status,
      productId: finalProductId,
      productName: finalProductName,
      affiliateLink: finalAffiliateLink,
      commissionValue: finalCommissionValue,
      reviewedAt: new Date().toISOString()
    });
  });
}

export async function markWithdrawalStatus(
  withdrawalId: string,
  userId: string,
  amount: number,
  status: "paid" | "cancelled"
) {
  await runTransaction(db, async (transaction) => {
    const withdrawalRef = doc(db, "withdrawals", withdrawalId);

    const withdrawalSnapshot = await transaction.get(withdrawalRef);
    if (!withdrawalSnapshot.exists()) {
      throw new Error("Không tìm thấy yêu cầu rút tiền.");
    }

    const withdrawal = withdrawalSnapshot.data() as WithdrawalRequest;
    if (withdrawal.status !== "pending") {
      throw new Error("Yêu cầu rút tiền không còn ở trạng thái chờ xử lý.");
    }

    const resolvedUserId = withdrawal.userId || userId;
    const withdrawalAmount = withdrawal.amount || amount;
    let nextBalance: number | null = null;
    let userRef = doc(db, "users", resolvedUserId);

    if (status === "paid") {
      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists()) {
        throw new Error("Không tìm thấy user.");
      }

      const user = userSnapshot.data() as AppUser;
      if (user.balance < withdrawalAmount) {
        throw new Error("Số dư user không đủ để chi trả.");
      }

      nextBalance = user.balance - withdrawalAmount;
    }

    transaction.update(withdrawalRef, {
      status,
      processedAt: new Date().toISOString()
    });

    if (status === "paid" && nextBalance !== null) {
      transaction.update(userRef, {
        balance: nextBalance
      });
    }
  });
}

export async function adjustUserBalance(userId: string, balance: number) {
  await updateDoc(doc(db, "users", userId), {
    balance
  });
}

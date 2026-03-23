import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore/lite";
import { dbLite } from "@/lib/firebase-lite";
import { AppUser, Order, Product, WithdrawalRequest } from "@/lib/types";

const usersCollection = collection(dbLite, "users");
const productsCollection = collection(dbLite, "products");
const ordersCollection = collection(dbLite, "orders");
const withdrawalsCollection = collection(dbLite, "withdrawals");

function docsToArray<T>(snapshot: Awaited<ReturnType<typeof getDocs>>) {
  return snapshot.docs.map((entry) => entry.data() as T);
}

export async function getProducts() {
  const snapshot = await getDocs(productsCollection);
  return docsToArray<Product>(snapshot);
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(dbLite, "users", userId));
  return snapshot.exists() ? (snapshot.data() as AppUser) : null;
}

export async function getOrdersForUser(userId: string) {
  const snapshot = await getDocs(query(ordersCollection, where("userId", "==", userId)));
  return docsToArray<Order>(snapshot);
}

export async function getWithdrawalsForUser(userId: string) {
  const snapshot = await getDocs(query(withdrawalsCollection, where("userId", "==", userId)));
  return docsToArray<WithdrawalRequest>(snapshot);
}

export async function createUser(user: AppUser) {
  await setDoc(doc(dbLite, "users", user.id), user);
}

export async function createOrder(order: Order) {
  await setDoc(doc(dbLite, "orders", order.id), {
    ...order,
    reviewedAt: null
  });
}

export async function createWithdrawal(withdrawal: WithdrawalRequest) {
  await setDoc(doc(dbLite, "withdrawals", withdrawal.id), withdrawal);
}

export async function updateUserBank(userId: string, linkedBank: AppUser["linkedBank"]) {
  await updateDoc(doc(dbLite, "users", userId), {
    linkedBank
  });
}

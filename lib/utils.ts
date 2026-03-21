import { OrderStatus, WithdrawalStatus } from "@/lib/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function orderStatusLabel(status: OrderStatus) {
  if (status === "processing") return "Đang xử lý";
  if (status === "completed") return "Hoàn thành";
  return "Từ chối";
}

export function withdrawalStatusLabel(status: WithdrawalStatus) {
  if (status === "pending") return "Chờ chi trả";
  if (status === "paid") return "Đã thanh toán";
  return "Đã hủy";
}

export function passwordIsValid(password: string) {
  return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function usernameIsValid(username: string) {
  return username.trim().length > 6;
}

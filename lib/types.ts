export type OrderStatus = "processing" | "completed" | "rejected";

export type WithdrawalStatus = "pending" | "paid" | "cancelled";

export type UserRole = "user" | "admin";

export interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  commissionPercent: number;
  commissionValue: number;
  affiliateLink: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  balance: number;
  linkedBank: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    linkedAt: string;
  } | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  username: string;
  productId: string;
  productName: string;
  affiliateLink: string;
  commissionValue: number;
  status: OrderStatus;
  submittedAt: string;
  reviewedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
}

export interface DashboardStats {
  totalProducts: number;
  processingOrders: number;
  completedOrders: number;
  pendingWithdrawals: number;
  totalPaidWithdrawalsAmount: number;
  totalBalance: number;
}

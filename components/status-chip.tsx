import { OrderStatus, WithdrawalStatus } from "@/lib/types";
import { orderStatusLabel, withdrawalStatusLabel } from "@/lib/utils";

interface StatusChipProps {
  status: OrderStatus | WithdrawalStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const className =
    status === "completed" || status === "paid"
      ? "status-chip status-completed"
      : status === "rejected" || status === "cancelled"
        ? "status-chip status-rejected"
        : "status-chip status-processing";

  const label =
    status === "processing" || status === "completed" || status === "rejected"
      ? orderStatusLabel(status)
      : withdrawalStatusLabel(status);

  return <span className={className}>{label}</span>;
}

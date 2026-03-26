"use client";

import { useEffect, useState } from "react";

export function NotificationModal() {
  const [showNotification, setShowNotification] = useState(true);

  const hideNotification = () => {
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <div className="notification-modal" role="dialog" aria-labelledby="notification-title" aria-modal="true">
      <div className="modal-overlay" onClick={hideNotification} />
      <div className="modal-content">
       <p>
  <strong>
    Nếu chưa có sản phẩm mà bạn cần hãy nhắn cho page link sản phẩm nhé!
  </strong>
  <br />
  <span className="danger-text">
     *LƯU Ý: KHÔNG ĐƯỢC DÙNG 2 TÀI KHOẢN SHOPPE DÙNG CHUNG 1 ĐỊA CHỈ MẠNG VÀ ĐỊA CHỈ NHẬN NẾU KHÔNG SẼ BỊ TỪ CHỐI. MỌI SỐ TIỀN HOÀN LẠI HIỂN THỊ TRÊN WEB ĐỀU LÀ ƯỚC TÍNH
  </span>
</p>
        <button className="modal-ok-button" onClick={hideNotification} autoFocus>
          OK
        </button>
      </div>

    </div>
  );
}

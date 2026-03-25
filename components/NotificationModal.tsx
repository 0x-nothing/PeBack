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
        <p><strong>Nếu chưa có sản phẩm mà bạn cần hãy nhắn cho page link sản phẩm nhé!</strong></p>
        <button className="modal-ok-button" onClick={hideNotification} autoFocus>
          OK
        </button>
      </div>

    </div>
  );
}

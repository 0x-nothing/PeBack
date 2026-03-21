"use client";

import Link from "next/link";
import { SessionState } from "@/lib/session";

interface TopbarProps {
  session: SessionState | null;
  onLogout: () => void;
}

export function Topbar({ session, onLogout }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="page-shell topbar__inner">
        <Link href="/" className="brand">
          <span className="brand-mark">P</span>
          <span className="brand-copy">
            <strong>
              Pe<span>Back</span>
            </strong>
            <small>Sàn hoa hồng affiliate gọn, dễ dùng</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Điều hướng chính">
          <Link href="#products" className="nav-link">
            Sản phẩm
          </Link>
          <Link href="#orders" className="nav-link">
            Gửi mã đơn
          </Link>
          <Link href="#withdrawals" className="nav-link">
            Rút tiền
          </Link>
          {session?.role === "admin" ? (
            <Link href="/admin" className="button-muted button-muted--compact">
              Quản trị
            </Link>
          ) : null}
          {session ? (
            <div className="session-pill">
              <span>{session.username}</span>
              <button className="button-ghost button-ghost--compact" onClick={onLogout} type="button">
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link href="#auth" className="button button--compact">
              Đăng ký
            </Link>
          )}
        </nav>
      </div>

      <div className="mobile-dock" aria-label="Điều hướng nhanh trên điện thoại">
        <Link href="#products" className="mobile-dock__item">
          <span>Sản phẩm</span>
        </Link>
        <Link href="#orders" className="mobile-dock__item">
          <span>Mã đơn</span>
        </Link>
        <Link href="#withdrawals" className="mobile-dock__item">
          <span>Ví tiền</span>
        </Link>
        <Link href={session ? "#orders" : "#auth"} className="mobile-dock__item mobile-dock__item--accent">
          <span>{session ? "Đơn của tôi" : "Đăng ký"}</span>
        </Link>
      </div>
    </header>
  );
}

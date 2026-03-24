"use client";

import Image from "next/image";
import Link from "next/link";
import { SessionState } from "@/lib/session";

interface TopbarProps {
  session: SessionState | null;
  onLogout: () => void;
  onSearchToggle?: () => void;
}

export function Topbar({ session, onLogout, onSearchToggle }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="page-shell topbar__inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Image src="/1.png" alt="PeBack logo" width={44} height={44} sizes="44px" priority />
          </span>
          <span className="brand-copy">
            <strong>
              Pe<span>Back</span>
            </strong>
            <small>Sàn hoa hồng affiliate gọn, dễ dùng</small>
          </span>
        </Link>

        <nav className="nav-links nav-links--compact" aria-label="Điều hướng chính">
          <Link href="#products" className="nav-link nav-link--icon">
            <Image src="/shopping-cart.png" alt="Sản phẩm" width={20} height={20} />
            <span>Sản phẩm</span>
          </Link>
          <Link href="#orders" className="nav-link nav-link--icon">
            <Image src="/tracking-number.png" alt="Mã đơn" width={20} height={20} />
            <span>Mã đơn</span>
          </Link>
          <Link href="#withdrawals" className="nav-link nav-link--icon">
            <Image src="/wallet-filled-money-tool.png" alt="Ví tiền" width={20} height={20} />
            <span>Ví</span>
          </Link>
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

        <button
          className="search-btn"
          onClick={onSearchToggle}
          aria-label="Tìm kiếm sản phẩm"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mobile-dock" aria-label="Điều hướng nhanh trên điện thoại">
        <Link href="#products" className="mobile-dock__item" aria-label="Sản phẩm">
          <Image src="/shopping-cart.png" alt="Sản phẩm" width={22} height={22} />
          <span>Sản phẩm</span>
        </Link>
        <Link href="#orders" className="mobile-dock__item" aria-label="Mã đơn">
          <Image src="/tracking-number.png" alt="Mã đơn" width={22} height={22} />
          <span>Mã đơn</span>
        </Link>
        <Link href="#withdrawals" className="mobile-dock__item" aria-label="Ví tiền">
          <Image src="/wallet-filled-money-tool.png" alt="Ví" width={22} height={22} />
          <span>Ví</span>
        </Link>
      </div>
    </header>
  );
}

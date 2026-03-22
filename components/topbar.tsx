"use client";

import Image from "next/image";
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
          <span className="brand-mark">
            <Image src="/1.png" alt="PeBack logo" width={44} height={44} sizes="44px" priority />
          </span>
          <span className="brand-copy">
            <strong>
              Pe<span>Back</span>
            </strong>
            <small>San hoa hong affiliate gon, de dung</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Dieu huong chinh">
          <Link href="#products" className="nav-link">
            San pham
          </Link>
          <Link href="#orders" className="nav-link">
            Gui ma don
          </Link>
          <Link href="#withdrawals" className="nav-link">
            Rut tien
          </Link>
          {session ? (
            <div className="session-pill">
              <span>{session.username}</span>
              <button className="button-ghost button-ghost--compact" onClick={onLogout} type="button">
                Dang xuat
              </button>
            </div>
          ) : (
            <Link href="#auth" className="button button--compact">
              Dang ky
            </Link>
          )}
        </nav>
      </div>

      <div className="mobile-dock" aria-label="Dieu huong nhanh tren dien thoai">
        <Link href="#products" className="mobile-dock__item">
          <span>San pham</span>
        </Link>
        <Link href="#orders" className="mobile-dock__item">
          <span>Ma don</span>
        </Link>
        <Link href="#withdrawals" className="mobile-dock__item">
          <span>Vi tien</span>
        </Link>
        <Link href={session ? "#orders" : "#auth"} className="mobile-dock__item mobile-dock__item--accent">
          <span>{session ? "Don cua toi" : "Dang ky"}</span>
        </Link>
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeBack",
  description: "Nen tang chia se hoa hong Shopee Affiliate voi user web va admin local",
  icons: {
    icon: "/1.png",
    shortcut: "/1.png",
    apple: "/1.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <a
          className="contact-fab"
          href="https://www.facebook.com/profile.php?id=61576500263507"
          target="_blank"
          rel="noreferrer"
          aria-label="Liên hệ Facebook"
        >
          <span className="contact-fab__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 3C6.48 3 2 7.15 2 12.28C2 15.2 3.45 17.81 5.72 19.52V23L9.09 21.15C10.02 21.41 10.99 21.55 12 21.55C17.52 21.55 22 17.4 22 12.28C22 7.15 17.52 3 12 3Z"
                fill="white"
              />
              <path d="M8.12 14.68L11.77 10.8L13.78 12.82L15.97 10.8L12.31 14.68L10.31 12.66L8.12 14.68Z" fill="#1877F2" />
            </svg>
          </span>
        </a>
      </body>
    </html>
  );
}

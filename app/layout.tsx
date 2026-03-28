import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { NotificationModal } from "@/components/NotificationModal";

const fontDisplay = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800", "900"],
  variable: "--font-display"
});

const fontBody = DM_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

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
      <body className={`${fontDisplay.variable} ${fontBody.variable}`}>
        {children}
        <NotificationModal />
        <a
          className="contact-fab"
          href="https://www.facebook.com/profile.php?id=61576500263507"
          target="_blank"
          rel="noreferrer"
          aria-label="Liên hệ Facebook"
        >
          <span className="contact-fab__icon" aria-hidden="true">
            <img 
src="/logomess.png" 
              alt="Messenger" 
              width="34" 
              height="34" 
              style={{borderRadius: '50%', objectFit: 'cover'}}
            />
          </span>
        </a>
      </body>
    </html>
  );
}




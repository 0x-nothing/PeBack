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
      <body>{children}</body>
    </html>
  );
}

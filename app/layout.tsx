import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeBack",
  description: "Nen tang chia se hoa hong Shopee Affiliate voi user web va admin local"
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

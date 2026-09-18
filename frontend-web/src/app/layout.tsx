import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Department of Software Engineering UET PESHAWAR | Attendance System",
  description: "Official QR-based attendance management system for University of Engineering and Technology, Peshawar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}



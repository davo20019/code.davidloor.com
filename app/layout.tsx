import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "code.davidloor.com", description: "Interview prep" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}

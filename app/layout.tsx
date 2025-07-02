import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { UserProvider } from "@/contexts/UserContext" // Import UserProvider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "电试院项目管理系统",
  description: "储备项目管理模块",
  generator: 'v0.dev',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
        <html lang="en">
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
      </head>
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider> {/* Wrap children with UserProvider */}
      </body>
    </html>
  )
}

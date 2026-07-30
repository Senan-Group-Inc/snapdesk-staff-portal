import type { Metadata } from 'next'
import { Urbanist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Service Desk — Staff admin',
  description: 'Senan Service Desk platform administration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className={urbanist.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

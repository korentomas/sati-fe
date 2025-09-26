import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SATI - Satellite Imagery Gateway',
  description: 'Satellite Imagery Analysis and Processing Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

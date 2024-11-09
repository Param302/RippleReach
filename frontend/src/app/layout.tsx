import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'RippleReach',
  description: 'Email outreach platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="p-4 border-b">
          <h1>
            <Link href="/" className="text-xl font-bold">
              RippleReach
            </Link>
          </h1>
        </header>
        {children}
      </body>
    </html>
  )
}

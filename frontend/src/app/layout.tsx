// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import './global.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NEAR Social Media Scheduler',
  description: 'Schedule and manage your social media posts for Telegram, powered by NEAR AI',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex bg-gray-50">
            {/* Navigation sidebar */}
            <Navigation />
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-16">
              {/* Page content with padding for mobile header */}
              <main className="flex-1 p-4 md:p-6 md:mt-0 mt-16 overflow-auto">
                <div className="max-w-7xl mx-auto">
                  <ProtectedRoute>
                    {children}
                  </ProtectedRoute>
                </div>
              </main>

              {/* Footer */}
              <footer className="bg-white border-t p-4 text-center text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Social Media Scheduler, powered by NEAR AI
              </footer>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
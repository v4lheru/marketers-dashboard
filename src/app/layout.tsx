import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Marketers Dashboard - Olga',
  description: 'Comprehensive dashboard for reviewing marketing job applicants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-white">
            <div className="w-full px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Marketers Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Review and manage marketing job applicants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div id="width-toggle-container"></div>
                  <div id="dark-mode-toggle-container"></div>
                </div>
              </div>
            </div>
          </header>
          <main className="w-full px-6 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

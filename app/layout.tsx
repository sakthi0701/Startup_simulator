import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Startup Value Simulator',
  description: 'Model your startup funding rounds and calculate founder ownership.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add the `dark` className here
    <html lang="en" className="dark"> 
      <body className={inter.className}>{children}</body>
    </html>
  );
}
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  let title = 'Bagikan Layar Anda Secara Instan';
  let description = 'Aplikasi berbagi layar untuk guru dan siswa.';
  
  try {
    const titleSetting = await prisma.setting.findUnique({ where: { key: 'APP_TITLE' } });
    const descSetting = await prisma.setting.findUnique({ where: { key: 'APP_DESCRIPTION' } });
    if (titleSetting?.value) title = titleSetting.value;
    if (descSetting?.value) description = descSetting.value;
  } catch (error) {}

  return { title, description };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="header">
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-monitor-play"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/><polygon points="10 7 15 10 10 13 10 7"/></svg>
            Layar
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

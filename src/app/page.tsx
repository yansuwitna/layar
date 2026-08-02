import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let title = 'Bagikan Layar Anda Secara Instan';
  let description = 'Layar adalah aplikasi berbagi layar yang cepat, aman, dan mudah digunakan, dirancang khusus untuk guru dan siswa.';
  
  try {
    const titleSetting = await prisma.setting.findUnique({ where: { key: 'APP_TITLE' } });
    const descSetting = await prisma.setting.findUnique({ where: { key: 'APP_DESCRIPTION' } });
    if (titleSetting?.value) title = titleSetting.value;
    if (descSetting?.value) description = descSetting.value;
  } catch (error) {}

  return (
    <main className="container">
      <div className="hero">
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="hero-actions">
          <Link href="/student" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
            Masuk sebagai Siswa
          </Link>
          <Link href="/teacher" className="btn btn-primary">
            Masuk sebagai Guru
          </Link>
        </div>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Login Admin
          </Link>
        </div>
      </div>
    </main>
  );
}

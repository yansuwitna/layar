'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentJoin() {
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !token) return;
    
    router.push(`/room/${token}?name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Bergabung ke Kelas</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Masukkan namamu dan token yang diberikan oleh guru.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Kamu</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Token Guru</label>
            <input 
              type="text" 
              className="form-control" 
              value={token} 
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
            Masuk Sekarang
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            ← Kembali ke Home
          </Link>
        </div>
      </div>
    </main>
  );
}

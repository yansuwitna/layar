'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function AdminAuth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/setup')
      .then(res => res.json())
      .then(data => {
        if (data.needsSetup) {
          setNeedsSetup(true);
        }
      })
      .catch(err => {
        console.error('Gagal mengecek status setup', err);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = needsSetup ? '/api/admin/setup' : '/api/admin/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (needsSetup) {
          Swal.fire({
            title: 'Berhasil!',
            text: 'Akun Admin pertama berhasil dibuat.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
        localStorage.setItem('layar_admin', JSON.stringify(data.admin));
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Autentikasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan saat menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'white' }}>Memeriksa sistem...</div>;

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#e53e3e' }}>
          {needsSetup ? 'Buat Akun Admin Pertama' : 'Login Administrator'}
        </h2>
        {needsSetup && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Sistem mendeteksi belum ada admin. Silakan buat akun admin pertama Anda sekarang untuk mengamankan sistem.
          </p>
        )}
        {!needsSetup && <div style={{ marginBottom: '1.5rem' }}></div>}
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(229, 62, 62, 0.1)', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username Admin</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder={needsSetup ? "Buat username baru" : "Masukkan username"}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder={needsSetup ? "Buat password yang kuat" : "Masukkan password"}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ background: '#e53e3e', marginBottom: '1rem' }} disabled={loading}>
            {loading ? 'Memproses...' : (needsSetup ? 'Simpan Akun Admin' : 'Masuk sebagai Admin')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Kembali ke Home</a>
        </div>
      </div>
    </main>
  );
}

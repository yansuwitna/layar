'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function TeacherAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password validation logic
  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password)
  };
  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/teacher/login' : '/api/teacher/register';
    const payload = isLogin ? { username, password } : { username, name, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const text = await res.text().catch(() => 'Tidak ada teks respon');
        console.error('Gagal mengurai respon JSON. Status:', res.status, 'Respon:', text);
        setError(`Kesalahan server (${res.status}): Silakan cek terminal Next.js untuk detailnya.`);
        setLoading(false);
        return;
      }

      if (res.ok) {
        localStorage.setItem('layar_teacher', JSON.stringify(data.teacher));
        router.push('/teacher/dashboard');
      } else {
        setError(data.error || 'Autentikasi gagal');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Kesalahan jaringan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isLogin ? 'Login Guru' : 'Daftar Guru'}</h2>
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(229, 62, 62, 0.1)', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '2.5rem' }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {!isLogin && (
              <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ marginBottom: '0.3rem', fontWeight: 500 }}>Syarat Password:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: validations.length ? '#48bb78' : 'var(--text-secondary)' }}>
                  {validations.length ? <Check size={14} /> : <X size={14} />} Minimal 8 karakter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: validations.uppercase ? '#48bb78' : 'var(--text-secondary)' }}>
                  {validations.uppercase ? <Check size={14} /> : <X size={14} />} Mengandung huruf besar (A-Z)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: validations.lowercase ? '#48bb78' : 'var(--text-secondary)' }}>
                  {validations.lowercase ? <Check size={14} /> : <X size={14} />} Mengandung huruf kecil (a-z)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: validations.number ? '#48bb78' : 'var(--text-secondary)' }}>
                  {validations.number ? <Check size={14} /> : <X size={14} />} Mengandung angka (0-9)
                </div>
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading || (!isLogin && !isPasswordValid)}>
            {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}>
            {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
          </a>
        </p>
        
        <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            ← Kembali ke Home
          </Link>
        </div>
      </div>
    </main>
  );
}

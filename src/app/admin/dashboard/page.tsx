'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, KeyRound, LogOut, ShieldAlert, Settings, Users, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

type Teacher = {
  id: string;
  username: string;
  name?: string;
  token: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<{ username: string } | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teachers' | 'settings'>('teachers');
  
  // Settings state
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [useLiveKit, setUseLiveKit] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const router = useRouter();

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/admin/teachers');
      const data = await res.json();
      if (data.teachers) setTeachers(data.teachers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.config) {
        setApiKey(data.config['LIVEKIT_API_KEY'] || '');
        setApiSecret(data.config['LIVEKIT_API_SECRET'] || '');
        setServerUrl(data.config['LIVEKIT_URL'] || '');
        setAppTitle(data.config['APP_TITLE'] || 'Bagikan Layar Anda Secara Instan');
        setAppDescription(data.config['APP_DESCRIPTION'] || 'Layar adalah aplikasi berbagi layar...');
        setUseLiveKit(data.config['USE_LIVEKIT'] !== 'false');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('layar_admin');
    if (!data) {
      router.push('/admin');
    } else {
      setAdmin(JSON.parse(data));
      fetchTeachers();
      fetchSettings();
    }
  }, [router]);

  const handleDelete = async (id: string, username: string) => {
    const result = await Swal.fire({
      title: 'Hapus Guru?',
      text: `Apakah Anda yakin ingin menghapus akun guru ${username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#a0aec0',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        Swal.fire('Terhapus!', 'Akun guru berhasil dihapus.', 'success');
        fetchTeachers();
      } else {
        const data = await res.json();
        Swal.fire('Gagal!', data.error || 'Gagal menghapus akun', 'error');
      }
    } catch (err) {
      Swal.fire('Error!', 'Terjadi kesalahan sistem', 'error');
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Password',
      text: `Masukkan password baru untuk guru ${username}:`,
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value) {
          return 'Password tidak boleh kosong!';
        }
      }
    });

    if (!newPassword) return;

    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        Swal.fire('Berhasil!', 'Password berhasil direset.', 'success');
      } else {
        const data = await res.json();
        Swal.fire('Gagal!', data.error || 'Gagal mereset password', 'error');
      }
    } catch (err) {
      Swal.fire('Error!', 'Terjadi kesalahan sistem', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          LIVEKIT_API_KEY: apiKey,
          LIVEKIT_API_SECRET: apiSecret,
          LIVEKIT_URL: serverUrl,
          APP_TITLE: appTitle,
          APP_DESCRIPTION: appDescription,
          USE_LIVEKIT: useLiveKit ? 'true' : 'false'
        }),
      });
      
      if (res.ok) {
        Swal.fire('Berhasil!', 'Pengaturan LiveKit berhasil disimpan!', 'success');
      } else {
        Swal.fire('Gagal!', 'Gagal menyimpan pengaturan', 'error');
      }
    } catch (err) {
      Swal.fire('Error!', 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: "Anda akan keluar dari panel admin.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('layar_admin');
        router.push('/admin');
      }
    });
  };

  if (!admin) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat...</div>;

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e53e3e', margin: 0 }}>
          <ShieldAlert size={28} /> Panel Admin
        </h2>
        
        <button onClick={handleLogout} className="btn btn-primary" style={{ background: 'rgba(229,62,62,0.1)', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'none' }}>
          <LogOut size={16} /> Keluar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className="btn"
          onClick={() => setActiveTab('teachers')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'teachers' ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)', color: activeTab === 'teachers' ? 'white' : 'var(--text-primary)' }}
        >
          <Users size={16} /> Kelola Guru
        </button>
        <button 
          className="btn"
          onClick={() => setActiveTab('settings')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: activeTab === 'settings' ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)', color: activeTab === 'settings' ? 'white' : 'var(--text-primary)' }}
        >
          <Settings size={16} /> Pengaturan LiveKit
        </button>
      </div>

      {activeTab === 'teachers' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Daftar Guru</h3>
          
          {loading ? (
            <p>Memuat data guru...</p>
          ) : teachers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Belum ada guru yang mendaftar.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Username</th>
                    <th style={{ padding: '1rem' }}>Nama Lengkap</th>
                    <th style={{ padding: '1rem' }}>Token Ruangan</th>
                    <th style={{ padding: '1rem' }}>Tanggal Mendaftar</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(teacher => (
                    <tr key={teacher.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}><strong>{teacher.username}</strong></td>
                      <td style={{ padding: '1rem' }}>{teacher.name || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{teacher.token}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(teacher.createdAt).toLocaleDateString('id-ID')}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleResetPassword(teacher.id, teacher.username)}
                          className="btn" 
                          style={{ padding: '0.4rem 0.8rem', background: '#3182ce', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                          title="Reset Password"
                        >
                          <KeyRound size={14} /> Reset
                        </button>
                        <button 
                          onClick={() => handleDelete(teacher.id, teacher.username)}
                          className="btn" 
                          style={{ padding: '0.4rem 0.8rem', background: '#e53e3e', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                          title="Hapus Akun"
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Pengaturan Aplikasi & LiveKit</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Konfigurasi ini akan disimpan secara aman di database.
          </p>

          <form onSubmit={handleSaveSettings}>
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Tampilan Halaman Utama</h4>
              <div className="form-group">
                <label>Judul Aplikasi (Title)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={appTitle} 
                  onChange={(e) => setAppTitle(e.target.value)}
                  placeholder="Misal: Bagikan Layar Anda"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deskripsi Aplikasi</label>
                <textarea 
                  className="form-control" 
                  value={appDescription} 
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Deskripsi..."
                  required
                  rows={3}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Konfigurasi Server LiveKit</h4>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(90, 103, 216, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                <input 
                  type="checkbox" 
                  id="useLiveKit"
                  checked={useLiveKit} 
                  onChange={(e) => setUseLiveKit(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="useLiveKit" style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  Aktifkan Sistem LiveKit (Untuk Berbagi Layar)
                </label>
              </div>

              <div className="form-group">
                <label>LiveKit API Key</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="misal: APIxxx..."
                  required
                />
              </div>
            <div className="form-group">
              <label>LiveKit API Secret</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showSecret ? "text" : "password"} 
                  className="form-control" 
                  value={apiSecret} 
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Rahasia, jangan disebarkan"
                  required
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowSecret(!showSecret)}
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
                  title={showSecret ? "Sembunyikan rahasia" : "Tampilkan rahasia"}
                >
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>LiveKit WebSocket URL</label>
              <input 
                type="text" 
                className="form-control" 
                value={serverUrl} 
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="wss://namaproject.livekit.cloud"
                required
              />
            </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

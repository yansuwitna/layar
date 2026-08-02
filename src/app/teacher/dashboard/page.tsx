'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, LogOut } from 'lucide-react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  VideoTrack
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import Swal from 'sweetalert2';
import PeerTeacher from '@/app/components/PeerTeacher';

function ScreenShareView() {
  const tracks = useTracks([Track.Source.ScreenShare]);
  
  if (tracks.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#666', fontSize: '1.2rem' }}>
        Tidak ada layar yang dibagikan. Klik ikon komputer/layar di bawah untuk mulai membagikan layar.
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {tracks.map((track) => (
         <VideoTrack key={track.trackSid} trackRef={track} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ))}
    </div>
  );
}

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<{ username: string; name?: string; token: string } | null>(null);
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [useLiveKit, setUseLiveKit] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('layar_teacher');
    if (!data) {
      router.push('/teacher');
    } else {
      const parsedTeacher = JSON.parse(data);
      setTeacher(parsedTeacher);
      
      fetch(`/api/livekit?room=${parsedTeacher.token}&username=${parsedTeacher.username}&role=teacher`)
        .then(res => res.json())
        .then(data => {
          if (data.useLiveKit === false) {
            setUseLiveKit(false);
            if (data.clientIp) setServerUrl(data.clientIp); // Using serverUrl as a temp state for IP
          } else if (data.token && data.serverUrl) {
            setToken(data.token);
            setServerUrl(data.serverUrl);
            setUseLiveKit(true);
          } else {
            Swal.fire('Gagal!', data.error || 'Gagal mendapatkan token dari server', 'error');
          }
        });
    }
  }, [router]);

  const copyToken = () => {
    if (teacher) {
      navigator.clipboard.writeText(teacher.token);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Token berhasil disalin ke clipboard.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Keluar?',
      text: "Anda akan keluar dari sesi mengajar.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('layar_teacher');
        router.push('/teacher');
      }
    });
  };

  if (!teacher) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat...</div>;

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Panel Guru</h2>
        <button onClick={handleLogout} className="btn" style={{ background: 'rgba(229,62,62,0.1)', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px' }}>
          <LogOut size={16} /> Keluar
        </button>
      </div>

      <div className="layout-grid">
        <div className="card">
          <h2>Selamat Datang, {teacher.name || teacher.username}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Bagikan token ini ke siswa agar mereka bisa bergabung ke kelasmu.
          </p>
          
          <div className="token-display">
            {teacher.token}
          </div>
          
          <button className="btn btn-primary btn-block" onClick={copyToken} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Copy size={18} /> Salin Token
          </button>
          
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>Catatan:</strong> Gunakan panel kontrol di bawah layar (Mic, Share Screen) untuk mulai mengajar. Siswa otomatis akan melihat layarmu. Kamera telah dinonaktifkan sesuai permintaan.
          </p>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0 }}>Siaran Kelas Langsung</h3>
          </div>
          
          <div className="video-container" style={{ height: '600px', backgroundColor: '#111', display: 'flex', flexDirection: 'column' }}>
            {useLiveKit === false ? (
              <PeerTeacher token={teacher.token} teacherIp={serverUrl} />
            ) : token && serverUrl ? (
              <LiveKitRoom
                video={false} // Disable camera
                audio={false} // Microphone enabled manually via ControlBar
                token={token}
                serverUrl={serverUrl}
                data-lk-theme="default"
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <ScreenShareView />
                </div>
                <ControlBar controls={{ microphone: true, screenShare: true, camera: false, chat: false }} />
                <RoomAudioRenderer />
              </LiveKitRoom>
            ) : (
              <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center', padding: '2rem' }}>
                Menghubungkan ke Server... 
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

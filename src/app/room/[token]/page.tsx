'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MonitorPlay, LogOut } from 'lucide-react';
import Link from 'next/link';
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
  useTracks,
  VideoTrack
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import Swal from 'sweetalert2';
import PeerStudent from '@/app/components/PeerStudent';
import ZoomableVideoWrapper from '@/app/components/ZoomableVideoWrapper';

import { getLocalIP } from '@/lib/getIp';

function RemoteTracksView() {
  const screenTracks = useTracks([Track.Source.ScreenShare]);
  const cameraTracks = useTracks([Track.Source.Camera]);
  
  const tracks = [...screenTracks, ...cameraTracks];
  
  if (tracks.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#666', fontSize: '1.2rem', textAlign: 'center', padding: '1rem' }}>
        Menunggu guru membagikan layar atau kamera...
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', display: 'flex', flexWrap: 'wrap' }}>
      {tracks.map((track, idx) => (
         <VideoTrack key={track.publication?.trackSid || track.participant?.identity || idx} trackRef={track} style={{ flex: 1, width: '100%', height: '100%', objectFit: 'contain' }} />
      ))}
    </div>
  );
}

export default function RoomPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Siswa';
  const [liveKitToken, setLiveKitToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [useLiveKit, setUseLiveKit] = useState<boolean | null>(null);
  const [clientIp, setClientIp] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/livekit?room=${token}&username=${encodeURIComponent(name)}&role=student`)
        .then(res => res.json())
        .then(data => {
          if (data.clientIp) {
            setClientIp(data.clientIp);
            if (data.clientIp === '127.0.0.1') {
              getLocalIP().then(ip => {
                if (ip) setClientIp(ip);
              });
            }
          }

          if (data.useLiveKit === false) {
            setUseLiveKit(false);
            if (data.teacherIp) setServerUrl(data.teacherIp); // using serverUrl state to hold teacherIp
          } else if (data.token && data.serverUrl) {
            setLiveKitToken(data.token);
            setServerUrl(data.serverUrl);
            setUseLiveKit(true);
          } else {
            setError(data.error || 'Gagal mendapatkan token akses');
            Swal.fire('Gagal!', data.error || 'Gagal mendapatkan token akses', 'error');
          }
        })
      .catch(err => {
        setError('Gagal terhubung ke server');
        Swal.fire('Error!', 'Gagal terhubung ke server', 'error');
      });
  }, [token, name]);

  const handleLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    Swal.fire({
      title: 'Keluar Kelas?',
      text: "Anda akan keluar dari kelas ini.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/';
      }
    });
  };

  return (
    <main className="container" style={{ maxWidth: '1400px' }}>
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MonitorPlay size={20} color="var(--primary-color)" />
            Ruang Kelas
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Bergabung sebagai: <strong style={{ color: 'var(--text-primary)' }}>{name}</strong> | Token: <strong>{token}</strong>
            {clientIp && <span> | IP Anda: <strong>{clientIp}</strong></span>}
          </p>
        </div>
        
        <button onClick={handleLeave} className="btn btn-primary" style={{ background: 'rgba(229,62,62,0.1)', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'none' }}>
          <LogOut size={16} /> Keluar Kelas
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#111', height: '75vh', display: 'flex', flexDirection: 'column' }}>
        {error ? (
          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#ff4a4a', padding: '2rem', textAlign: 'center' }}>
            {error}
          </div>
        ) : useLiveKit === false ? (
          <PeerStudent token={token} teacherIp={serverUrl} />
        ) : (!liveKitToken || !serverUrl) ? (
          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
            Menghubungkan ke Kelas...
          </div>
        ) : (
          <ZoomableVideoWrapper>
            <LiveKitRoom
              video={false} 
              audio={false} 
              token={liveKitToken}
              serverUrl={serverUrl}
              data-lk-theme="default"
              style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <RemoteTracksView />
              </div>
              <RoomAudioRenderer />
            </LiveKitRoom>
          </ZoomableVideoWrapper>
        )}
      </div>
    </main>
  );
}

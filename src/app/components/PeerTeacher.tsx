'use client';

import { useEffect, useRef, useState } from 'react';
import { MonitorUp, Square } from 'lucide-react';
import { getLocalIP } from '@/lib/getIp';

export default function PeerTeacher({ token, teacherIp }: { token: string, teacherIp?: string }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [connections, setConnections] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [localIp, setLocalIp] = useState(teacherIp || '');
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    // Attempt to get physical LAN IP via WebRTC if server IP is localhost
    if (teacherIp === '127.0.0.1') {
      getLocalIP().then(ip => {
        if (ip) setLocalIp(ip);
      });
    }
  }, [teacherIp]);

  const startScreenShare = async () => {
    try {
      setError('');
      setIsStarting(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Fitur berbagi layar tidak didukung di perangkat atau browser ini. Pastikan Anda menggunakan PC/Laptop dan mengakses melalui HTTPS.');
      }
      
      let mediaStream;
      try {
        // Coba dengan audio (Chrome/Edge mendukung ini)
        mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } catch (audioErr: any) {
        // Safari (Mac/iPad) akan error jika kita meminta audio di layar.
        // Fallback: Minta video (layar) saja tanpa audio.
        console.warn('Share screen with audio failed, falling back to video only.', audioErr);
        mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      }
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Dynamically import PeerJS to prevent SSR issues
      const { default: Peer } = await import('peerjs');
      const peer = new Peer(`layar-room-${token}`);
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        setPeerId(id);
      });

      peer.on('call', (call: any) => {
        call.answer(mediaStream);
        setConnections((prev) => prev + 1);
        call.on('close', () => {
          setConnections((prev) => prev - 1);
        });
        call.on('error', (err: any) => {
           console.error('Call error', err);
        });
      });

      peer.on('error', (err: any) => {
         console.error('Peer error', err);
         if (err.type === 'unavailable-id') {
             setError('Sesi kelas ini sudah aktif di tempat lain.');
             stopScreenShare();
         }
      });

      // When screen share stops from browser UI
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error('Error sharing screen:', err);
      // Hide error if user just pressed Cancel
      if (err.name !== 'NotAllowedError') {
         setError('Gagal membagikan layar: ' + err.message);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const startCameraShare = async () => {
    try {
      setError('');
      setIsStarting(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Try to use back camera by default
        audio: true 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const { default: Peer } = await import('peerjs');
      const peer = new Peer(`layar-room-${token}`);
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        setPeerId(id);
      });

      peer.on('call', (call: any) => {
        call.answer(mediaStream);
        setConnections((prev) => prev + 1);
        call.on('close', () => {
          setConnections((prev) => prev - 1);
        });
        call.on('error', (err: any) => {
           console.error('Call error', err);
        });
      });

      peer.on('error', (err: any) => {
         console.error('Peer error', err);
         if (err.type === 'unavailable-id') {
             setError('Sesi kelas ini sudah aktif di tempat lain.');
             stopScreenShare();
         }
      });
    } catch (err: any) {
      console.error('Error sharing camera:', err);
      setError('Gagal mengakses kamera: ' + err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setStream(null);
    setConnections(0);
    setIsStarting(false);
  };

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>Status: {stream ? 'Sedang Berbagi (Lokal)' : 'Menunggu'}</span>
          {localIp && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>| IP Anda: {localIp}</span>}
          {stream && <span style={{ color: '#48bb78', fontWeight: 'bold', fontSize: '0.9rem' }}>• {connections} Siswa</span>}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!stream ? (
            <>
              <button 
                className="btn btn-primary" 
                onClick={startScreenShare} 
                disabled={isStarting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
              >
                <MonitorUp size={16} /> {isStarting ? 'Memulai...' : 'Layar (PC)'}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={startCameraShare} 
                disabled={isStarting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#2b6cb0', color: 'white', border: 'none' }}
              >
                Kamera (HP)
              </button>
            </>
          ) : (
            <button 
              className="btn" 
              onClick={stopScreenShare} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#e53e3e', color: 'white' }}
            >
              <Square size={16} /> Hentikan
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ padding: '0.5rem 1rem', background: 'rgba(229, 62, 62, 0.2)', color: '#fc8181', fontSize: '0.9rem' }}>{error}</div>}

      <div className="video-container" style={{ flex: 1, background: '#000', borderRadius: 0, border: 'none', position: 'relative' }}>
        {!stream && !isStarting && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            <MonitorUp size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5, display: 'block' }} />
            <p>Pilih mode berbagi di atas. <strong>Layar (PC)</strong> untuk membagikan tampilan komputer, atau <strong>Kamera (HP)</strong> untuk menyorot pakai kamera.</p>
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: stream ? 'block' : 'none' }} 
        />
      </div>
    </div>
  );
}

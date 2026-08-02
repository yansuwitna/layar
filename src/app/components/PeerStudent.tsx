'use client';

import { useEffect, useRef, useState } from 'react';
import ZoomableVideoWrapper from './ZoomableVideoWrapper';

export default function PeerStudent({ token, teacherIp }: { token: string, teacherIp?: string }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<string>('Mempersiapkan...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connectToTeacher = async () => {
      if (!isMounted) return;
      try {
        const { default: Peer } = await import('peerjs');
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', () => {
          if (!isMounted) return;
          setStatus('Mencari sinyal Guru...');
          makeCall(peer);
        });

        peer.on('error', (err: any) => {
          if (err.type === 'peer-unavailable') {
            setStatus('Guru belum membagikan layar. Mencoba lagi dalam 3 detik...');
            if (retryTimeout.current) clearTimeout(retryTimeout.current);
            retryTimeout.current = setTimeout(() => {
              if (isMounted && peerRef.current && !peerRef.current.destroyed) {
                makeCall(peerRef.current);
              }
            }, 3000);
          } else {
            setStatus('Kesalahan koneksi: ' + err.message);
          }
        });

      } catch (err: any) {
        setStatus('Gagal memuat sistem: ' + err.message);
      }
    };

    const makeCall = (peer: any) => {
      if (!isMounted) return;
      try {
        // Create an empty canvas stream to pass to call (AudioContext can be blocked by browser)
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        // Some browsers need the canvas to be doing something or just captureStream() works
        const dummyStream = canvas.captureStream(0); 
        
        const call = peer.call(`layar-room-${token}`, dummyStream);
        callRef.current = call;

        call.on('stream', (remoteStream: MediaStream) => {
          if (!isMounted) return;
          console.log('Received remote stream from teacher:', remoteStream);
          setStream(remoteStream);
          setStatus('');
          if (videoRef.current) {
            videoRef.current.srcObject = remoteStream;
            // Handle autoplay block for streams with audio (e.g. Tab Share)
            videoRef.current.play().catch(e => {
              console.warn('Autoplay prevented:', e);
              setStatus('Layar siap. Silakan klik tombol Play atau layar ini untuk memulai.');
            });
          }
        });

        call.on('error', (err: any) => {
          setStatus('Gagal terhubung ke Guru: ' + err.message);
        });
        
        call.on('close', () => {
          if (!isMounted) return;
          setStatus('Guru telah menghentikan berbagi layar. Menunggu sesi berikutnya...');
          setStream(null);
          if (retryTimeout.current) clearTimeout(retryTimeout.current);
          retryTimeout.current = setTimeout(() => {
            if (isMounted && peerRef.current && !peerRef.current.destroyed) {
              makeCall(peerRef.current);
            }
          }, 3000);
        });
      } catch (err: any) {
        console.error('Call failed', err);
      }
    };

    connectToTeacher();

    return () => {
      isMounted = false;
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      if (callRef.current) callRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [token]);

  return (
    <ZoomableVideoWrapper>
      <div className="video-container" style={{ background: '#000', height: '100%', width: '100%', position: 'relative' }}>
        {!stream && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center', zIndex: 10 }}>
            {status}
          </div>
        )}
        {stream && teacherIp && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', zIndex: 10 }}>
            IP Guru: {teacherIp}
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          onClick={(e) => {
            e.currentTarget.play().catch(() => {});
            setStatus('');
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: stream ? 'block' : 'none', pointerEvents: 'none' }} 
        />
      </div>
    </ZoomableVideoWrapper>
  );
}

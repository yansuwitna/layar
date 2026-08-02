'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { Maximize, Minimize, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export default function ZoomableVideoWrapper({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setScale(1); // Reset zoom when exiting fullscreen
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) { /* Safari */
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any)?.msRequestFullscreen) { /* IE11 */
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) { /* Safari */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { /* IE11 */
        (document as any).msExitFullscreen();
      }
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 1));
  const handleResetZoom = () => setScale(1);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#000',
        overflow: scale > 1 ? 'auto' : 'hidden',
        display: 'flex',
        alignItems: scale > 1 ? 'flex-start' : 'center',
        justifyContent: scale > 1 ? 'flex-start' : 'center'
      }}
    >
      <div 
        style={{ 
          width: scale > 1 ? `${scale * 100}%` : '100%', 
          height: scale > 1 ? `${scale * 100}%` : '100%', 
          transition: 'width 0.2s, height 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {children}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(0,0,0,0.6)',
        padding: '0.5rem',
        borderRadius: '8px',
        zIndex: 1000
      }}>
        {scale > 1 && (
          <>
            <button onClick={handleZoomOut} style={btnStyle} title="Zoom Out">
              <ZoomOut size={20} color="white" />
            </button>
            <button onClick={handleResetZoom} style={btnStyle} title="Reset Zoom">
              <RefreshCw size={20} color="white" />
            </button>
          </>
        )}
        <button onClick={handleZoomIn} style={btnStyle} title="Zoom In">
          <ZoomIn size={20} color="white" />
        </button>
        <button onClick={toggleFullscreen} style={btnStyle} title="Toggle Fullscreen">
          {isFullscreen ? <Minimize size={20} color="white" /> : <Maximize size={20} color="white" />}
        </button>
      </div>
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  borderRadius: '4px',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s'
};

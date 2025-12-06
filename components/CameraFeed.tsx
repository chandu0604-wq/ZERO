import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface CameraFeedProps {
  isActive: boolean;
  onFrame?: (base64: string) => void;
}

export interface CameraHandle {
  capture: () => string | null;
}

const CameraFeed = forwardRef<CameraHandle, CameraFeedProps>(({ isActive }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          // Return base64 without prefix for Gemini
          return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        }
      }
      return null;
    }
  }));

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  return (
    <div className={`fixed top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border border-white/10 shadow-xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className="w-full h-full object-cover transform scale-x-[-1]" 
      />
      <div className="absolute bottom-1 left-2">
        <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] text-white/70 font-mono">REC</span>
        </div>
      </div>
    </div>
  );
});

export default CameraFeed;
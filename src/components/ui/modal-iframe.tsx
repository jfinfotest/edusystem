'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalIframeProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  fullScreen?: boolean;
}

export function ModalIframe({ isOpen, onClose, url, title = 'Ayuda', fullScreen = false }: ModalIframeProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Bloquear el scroll del body cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isMounted) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`relative w-full ${fullScreen ? 'h-screen' : 'max-w-4xl h-[80vh]'} bg-background ${fullScreen ? '' : 'rounded-lg'} shadow-lg flex flex-col`}>
        {/* Encabezado del modal */}
        <div className={`flex items-center justify-between p-4 border-b ${fullScreen ? 'sticky top-0 z-10 bg-background/95 backdrop-blur-sm' : ''}`}>
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button 
            variant={fullScreen ? "destructive" : "ghost"} 
            size="icon" 
            onClick={onClose}
            className={fullScreen ? "shadow-md hover:shadow-lg transition-all" : ""}
          >
            <X className={`${fullScreen ? "h-6 w-6" : "h-5 w-5"}`} />
          </Button>
        </div>
        
        {/* Contenido del iframe */}
        <div className={`flex-1 overflow-hidden ${fullScreen ? 'h-[calc(100vh-4rem)]' : ''}`}>
          <iframe 
            src={url} 
            className="w-full h-full border-0" 
            title={title}
            sandbox="allow-scripts allow-same-origin allow-forms"
            loading="lazy"
            style={{ height: fullScreen ? 'calc(100vh - 4rem)' : '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
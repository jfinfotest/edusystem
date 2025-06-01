'use client';

import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { generateFraudReflection } from '@/lib/gemini-fraud-reflection';
import { Loader2 } from 'lucide-react';

interface FraudReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fraudType: string;
  fraudCount: number;
  fraudMessage?: string;
}

export function FraudReflectionModal({
  isOpen,
  onClose,
  fraudType,
  fraudCount,
  fraudMessage = 'Se ha detectado un comportamiento sospechoso'
}: FraudReflectionModalProps) {
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState({
    title: 'Integridad Académica',
    message: 'Hemos detectado un comportamiento que podría comprometer la integridad de la evaluación.',
    suggestion: 'Por favor, continúa la evaluación sin utilizar recursos externos no autorizados.'
  });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      generateFraudReflection(fraudType, fraudCount)
        .then(result => {
          setReflection(result);
        })
        .catch(error => {
          console.error('Error al generar mensaje de reflexión:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, fraudType, fraudCount]);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-xl font-bold text-red-600 dark:text-red-400">
            {reflection.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center pt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Generando mensaje...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-red-500 dark:text-red-400 mb-3">
                  {fraudMessage}
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-base font-medium text-center italic">
                    <span className="text-3xl text-blue-500 dark:text-blue-400 font-serif">❝</span>
                    <span className="px-2">{reflection.message}</span>
                    <span className="text-3xl text-blue-500 dark:text-blue-400 font-serif">❞</span>
                  </p>
                </div>
                <p className="text-sm italic text-center">{reflection.suggestion}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Entendido, continuaré con integridad
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
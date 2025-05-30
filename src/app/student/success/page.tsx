'use client'

import { Suspense } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const alreadySubmitted = searchParams.get('alreadySubmitted') === 'true'

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/student')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            {alreadySubmitted ? (
              <AlertCircle className="h-16 w-16 text-amber-500" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {alreadySubmitted ? '¡Evaluación Ya Enviada!' : '¡Evaluación Enviada!'}
          </CardTitle>
          <CardDescription className="text-center">
            {alreadySubmitted 
              ? 'Esta evaluación ya fue enviada anteriormente. No es posible presentarla nuevamente.'
              : 'Tu evaluación ha sido enviada correctamente y será revisada por tu profesor.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Serás redirigido automáticamente a la página principal en unos segundos.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/student')}>
            Volver al Inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  )
}
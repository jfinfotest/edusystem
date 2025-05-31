'use client'

import { Suspense, useState } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2, Award, ChevronUp, Star } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Interfaz para el reporte generado
interface ReportResult {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  grade: number;
  congratulationMessage?: string;
  recommendationMessage?: string;
}

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const alreadySubmitted = searchParams.get('alreadySubmitted') === 'true'
  const reportParam = searchParams.get('report')
  const [report, setReport] = useState<ReportResult | null>(null)
  
  // Decodificar el reporte si está disponible
  useEffect(() => {
    if (reportParam) {
      try {
        console.log('Reporte codificado recibido:', reportParam);
        
        // Primero decodificar el URI component y luego el base64
        const decodedParam = decodeURIComponent(reportParam);
        console.log('Reporte URI decodificado:', decodedParam);
        
        const decodedString = Buffer.from(decodedParam, 'base64').toString();
        console.log('Reporte base64 decodificado:', decodedString);
        
        const decodedReport = JSON.parse(decodedString);
        console.log('Reporte JSON parseado:', decodedReport);
        
        setReport(decodedReport);
      } catch (error) {
        console.error('Error al decodificar el reporte:', error);
        
        // Intentar diferentes métodos de decodificación
        try {
          // Intentar decodificar directamente desde base64 sin decodeURIComponent
          const directDecoded = Buffer.from(reportParam, 'base64').toString();
          console.log('Intento directo base64:', directDecoded);
          const directReport = JSON.parse(directDecoded);
          setReport(directReport);
        } catch (secondError) {
          console.error('Error en el segundo intento de decodificación:', secondError);
          
          // Último intento: tratar de parsear directamente
          try {
            console.log('Intentando parsear directamente el parámetro');
            const directReport = JSON.parse(reportParam);
            setReport(directReport);
          } catch (thirdError) {
            console.error('Error en el tercer intento de decodificación:', thirdError);
          }
        }
      }
    }
  }, [reportParam])

  // Redirección automática después de un tiempo (solo si no hay reporte)
  useEffect(() => {
    if (!report) {
      const timer = setTimeout(() => {
        router.push('/student')
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [router, report])

  // Función para renderizar estrellas según la calificación
  const renderStars = (grade: number) => {
    const fullStars = Math.floor(grade)
    const hasHalfStar = grade % 1 >= 0.5
    const stars = []
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-5 w-5 text-yellow-400" />
            <Star className="absolute top-0 left-0 h-5 w-5 fill-yellow-400 text-yellow-400 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        )
      } else {
        stars.push(<Star key={i} className="h-5 w-5 text-gray-300" />)
      }
    }
    
    return <div className="flex space-x-1">{stars}</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className={`w-full ${report ? 'max-w-2xl' : 'max-w-md'} shadow-lg`}>
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            {alreadySubmitted ? (
              <AlertCircle className="h-16 w-16 text-amber-500" />
            ) : report ? (
              <Award className="h-16 w-16 text-blue-500" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {alreadySubmitted ? '¡Evaluación Ya Enviada!' : 
             report ? '¡Reporte de Evaluación!' : '¡Evaluación Enviada!'}
          </CardTitle>
          <CardDescription className="text-center">
            {alreadySubmitted 
              ? 'Esta evaluación ya fue enviada anteriormente. No es posible presentarla nuevamente.'
              : report 
                ? 'Aquí tienes un reporte detallado de tu desempeño en la evaluación.'
                : 'Tu evaluación ha sido enviada correctamente y será revisada por tu profesor.'}
          </CardDescription>
        </CardHeader>
        
        {report ? (
          <CardContent className="pb-6">
            <div className="mb-6 flex flex-col items-center">
              <div className="text-center mb-2">
                <span className="text-3xl font-bold">{report.grade.toFixed(1)}</span>
                <span className="text-xl">/5.0</span>
              </div>
              <div className="mb-4">{renderStars(report.grade)}</div>
              
              <div className="text-center text-sm text-muted-foreground mb-6">
                {report.grade >= 4.0 && report.congratulationMessage ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                    {report.congratulationMessage}
                  </div>
                ) : report.grade < 3.0 && report.recommendationMessage ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                    {report.recommendationMessage}
                  </div>
                ) : null}
              </div>
              
              <Tabs defaultValue="feedback" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="feedback">Retroalimentación</TabsTrigger>
                  <TabsTrigger value="strengths">Fortalezas</TabsTrigger>
                  <TabsTrigger value="improvements">Mejoras</TabsTrigger>
                </TabsList>
                
                <TabsContent value="feedback" className="mt-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p>{report.overallFeedback}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="strengths" className="mt-4">
                  <ul className="space-y-2">
                    {report.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="improvements" className="mt-4">
                  <ul className="space-y-2">
                    {report.areasForImprovement.map((area, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronUp className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-center text-muted-foreground">
              Serás redirigido automáticamente a la página principal en unos segundos.
            </p>
          </CardContent>
        )}
        
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
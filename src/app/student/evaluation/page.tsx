'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'


import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, BarChart, CheckCircle, ChevronLeft, ChevronRight, Clock, HelpCircle, Loader2, Send, Sparkles, X } from 'lucide-react'
import { ModalIframe } from '@/components/ui/modal-iframe'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Importar tema de monaco-themes (por ejemplo, Monokai)
import Monokai from 'monaco-themes/themes/Monokai.json';

// Carga diferida de los editores para mejorar el rendimiento
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
)

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
)

export default function StudentEvaluationPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"><Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" /><p className="text-xl text-gray-300">Cargando parámetros de la evaluación...</p></div>}>
      <EvaluationContent />
    </Suspense>
  )
}

// Opciones de lenguajes de programación para el editor Monaco
const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
]

// Servicios para evaluar con Gemini AI
import { evaluateStudentCode } from '@/lib/gemini-code-evaluation';
import { evaluateStudentText } from '@/lib/gemini-text-evaluation';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useTheme } from 'next-themes';
import { useMonaco } from '@monaco-editor/react';

// Tipos para los modelos de datos
type Question = {
  id: number
  text: string
  type: string
  answer?: string | null
  helpUrl?: string | null
}

type Answer = {
  questionId: number
  answer: string
  score?: number | null
  evaluated: boolean
  fraudAttempts?: number
  timeOutsideEval?: number
}

type EvaluationData = {
  id: number
  title: string
  description?: string
  helpUrl?: string
  questions: Question[]
  startTime: Date
  endTime: Date
}

// Los datos de evaluación ahora se cargan desde la base de datos

function EvaluationContent() {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const themeInitializedRef = useRef(false);
  const previousThemeRef = useRef(theme);

  // Nombres de los temas
  const monokaiThemeName = "monokai-custom";
  const lightThemeName = "github-light-custom";
  
  useEffect(() => {
    if (monaco && !themeInitializedRef.current) {
      // Definir tema oscuro (Monokai)
      monaco.editor.defineTheme(monokaiThemeName, {
        ...Monokai,
        base: Monokai.base as "vs-dark"
      });
      
      // Definir tema claro (podemos usar un tema predeterminado de Monaco)
      monaco.editor.defineTheme(lightThemeName, {
        base: "vs" as const,
        inherit: true,
        rules: [
          { token: 'comment', foreground: '008000' },
          { token: 'string', foreground: 'A31515' },
          { token: 'keyword', foreground: '0000FF' },
          { token: 'number', foreground: '098658' },
          { token: 'operator', foreground: '000000' },
          { token: 'function', foreground: '795E26' },
          { token: 'variable', foreground: '001080' },
          { token: 'type', foreground: '267F99' },
          { token: 'class', foreground: '267F99' },
          { token: 'interface', foreground: '267F99' },
        ],
        colors: {
          'editor.background': '#FFFFFF',
          'editor.foreground': '#252525',
          'editor.lineHighlightBackground': '#eeeeee',
          'editor.selectionBackground': '#add6ff',
          'editor.selectionHighlightBackground': '#add6ff',
          'editorCursor.foreground': '#000000',
          'editorWhitespace.foreground': '#bbbbbb',
          'editorIndentGuide.activeBackground': '#d3d3d3',
          'editor.selectionHighlightBorder': '#dddddd'
        }
      });
      
      themeInitializedRef.current = true;
    }
    
    // Aplicar el tema solo cuando cambie el tema actual
    if (monaco && themeInitializedRef.current && previousThemeRef.current !== theme) {
      monaco.editor.setTheme(theme === 'dark' ? monokaiThemeName : lightThemeName);
      previousThemeRef.current = theme;
    }
  }, [monaco, theme]);

  const router = useRouter()
  const searchParams = useSearchParams()

  const uniqueCode = searchParams.get('code')
  const email = searchParams.get('email')
  const firstName = searchParams.get('firstName')
  const lastName = searchParams.get('lastName')

  // Estado para la evaluación y respuestas
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [evaluating, setEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<{ success: boolean; message: string; details?: string; grade?: number } | null>(null)
  const [showAlert, setShowAlert] = useState<boolean>(true)
  const [buttonCooldown, setButtonCooldown] = useState<number>(0)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  // Estado para controlar el modal de confirmación de envío
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  // Estado para el contador de intentos de fraude
  const [fraudAttempts, setFraudAttempts] = useState<number>(0)
  // Estado para el tiempo fuera de la evaluación
  const [timeOutsideEval, setTimeOutsideEval] = useState<number>(0)
  // Estado para registrar cuando el usuario sale de la página
  const [leaveTime, setLeaveTime] = useState<number | null>(null)

  // Estado para el ID de la presentación (submission)
  const [submissionId, setSubmissionId] = useState<number | null>(null)

  // Estado para controlar si la evaluación está expirada
  const [isEvaluationExpired, setIsEvaluationExpired] = useState(false)

  // Refs for state values needed in event handlers to avoid dependency loops
  const fraudAttemptsRef = useRef(fraudAttempts);
  const timeOutsideEvalRef = useRef(timeOutsideEval);
  const leaveTimeRef = useRef(leaveTime);
  const answersRef = useRef(answers);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);

  // Calcular el progreso de la evaluación
  const calculateProgress = useCallback(() => {
    if (!answers.length) return 0
    const answeredQuestions = answers.filter(a => a.answer.trim().length > 0).length
    return Math.round((answeredQuestions / answers.length) * 100)
  }, [answers])
  // Effect to keep refs updated with the latest state

  // Effect to keep refs updated with the latest state
  useEffect(() => {
    fraudAttemptsRef.current = fraudAttempts;
    timeOutsideEvalRef.current = timeOutsideEval;
    leaveTimeRef.current = leaveTime;
    answersRef.current = answers;
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [fraudAttempts, timeOutsideEval, leaveTime, answers, currentQuestionIndex]);

  // Cargar datos de la evaluación
  useEffect(() => {
    if (!uniqueCode || !email || !firstName || !lastName) {
      console.error('Código de evaluación o datos del estudiante incompletos')
      // Add type guard to ensure we're not passing null to router.push
      router.push('/student')
      return
    }

    const loadEvaluationData = async () => {
      try {
        // Importar las acciones del servidor de forma dinámica para evitar errores de SSR
        const { getAttemptByUniqueCode, createSubmission } = await import('./actions')

        // Obtener los datos del intento por el código único
        const attemptResult = await getAttemptByUniqueCode(uniqueCode)

        if (!attemptResult.success) {
          // Verificar si el error es debido a que la evaluación ha expirado
          if (attemptResult.error === 'La evaluación ya ha finalizado' ||
            attemptResult.error === 'La evaluación aún no ha comenzado') {
            // Establecer el estado de evaluación expirada y mostrar la pantalla correspondiente
            setIsEvaluationExpired(true)
            setLoading(false)
            return
          }

          // Para otros errores, mostrar mensaje y redirigir
          console.error(attemptResult.error)
          router.push('/student')
          return
        }

        // Verificar que attempt y evaluationData existan
        const { attempt, evaluation: evaluationData } = attemptResult

        if (!attempt || !evaluationData) {
          console.error('Datos de evaluación incompletos')
          // Add type guard to ensure we're not passing null to router.push
          router.push('/student')
          return
        }

        // Verificar si la evaluación está dentro del rango de tiempo permitido
        const now = new Date()
        const startTime = new Date(attempt.startTime)
        const endTime = new Date(attempt.endTime)

        if (now < startTime || now > endTime) {
          // La evaluación está fuera del rango de tiempo permitido
          setIsEvaluationExpired(true)
          setLoading(false)
          return
        }

        // Crear una nueva presentación para este estudiante
        const submissionResult = await createSubmission(attempt.id, email, firstName, lastName)

        if (!submissionResult.success) {
          // Mostrar el mensaje de error específico
          console.error(submissionResult.error || 'Error al crear la presentación')

          // Si el error es porque la evaluación ya fue enviada, redirigir a una página específica
          if (submissionResult.error && submissionResult.error.includes('ya fue enviada')) {
            router.push(`/student/evaluation/success?alreadySubmitted=true&code=${uniqueCode}`)
          } else {
            // Para otros errores, redirigir a la página principal
            router.push('/student')
          }
          return
        }

        // Verificar que submission exista
        if (!submissionResult.submission) {
          console.error('Error al crear la presentación')
          // Add type guard to ensure we're not passing null to router.push
          router.push('/student')
          return
        }

        // Guardar el ID de la presentación para usarlo más tarde
        const submissionId = submissionResult.submission.id
        setSubmissionId(submissionId)

        // Convertir los datos de la evaluación al formato esperado por el componente
        const formattedEvaluation: EvaluationData = {
          id: evaluationData.id,
          title: evaluationData.title,
          description: evaluationData.description || undefined,
          helpUrl: evaluationData.helpUrl || undefined,
          questions: evaluationData.questions,
          startTime: attempt.startTime,
          endTime: attempt.endTime
        }

        setEvaluation(formattedEvaluation)

        // Obtener respuestas guardadas previamente
        const { getAnswersBySubmissionId } = await import('./actions')
        const answersResult = await getAnswersBySubmissionId(submissionId)

        const questions = evaluationData.questions || []
        let initialAnswers = questions.map(question => {
          // Inicializamos todas las respuestas como cadenas vacías por defecto
          return {
            questionId: question.id,
            answer: '',
            evaluated: false,
            score: null as number | null
          }
        })

        // Si hay respuestas guardadas, las cargamos
        if (answersResult.success && answersResult.answers) {
          console.log('Respuestas obtenidas:', answersResult.answers);

          // Actualizar las respuestas con los datos guardados
          initialAnswers = initialAnswers.map(defaultAnswer => {
            // Buscar la respuesta guardada para esta pregunta
            const savedAnswer = answersResult.answers.find(a => a.questionId === defaultAnswer.questionId)

            if (savedAnswer) {
              console.log(`Respuesta encontrada para pregunta ${defaultAnswer.questionId}:`, savedAnswer);

              return {
                ...defaultAnswer,
                answer: savedAnswer.answer || '',
                score: savedAnswer.score,
                evaluated: savedAnswer.score !== null
              }
            }
            return defaultAnswer
          })

          // Obtener los valores de fraude y tiempo fuera directamente de la submission
          // Estos valores ahora se almacenan en la presentación (Submission) y no en las respuestas (Answer)

          // Obtener la submission actual para acceder a sus campos
          const submission = submissionResult.submission;

          // Establecer los contadores globales desde la submission
          setFraudAttempts(submission.fraudAttempts || 0);
          setTimeOutsideEval(submission.timeOutsideEval || 0);
        } else {
          console.log('No se encontraron respuestas guardadas o hubo un error:', answersResult);
        }

        setAnswers(initialAnswers)
      } catch (error) {
        console.error('Error al cargar los datos de la evaluación:', error)
        console.error('Error al cargar la evaluación')
        router.push('/student')
      } finally {
        setLoading(false)
      }
    }

    loadEvaluationData()
  }, [uniqueCode, email, firstName, lastName, router])



  // Función para mostrar el diálogo de confirmación de envío
  const openSubmitDialog = useCallback(() => {
    if (!evaluation || !uniqueCode || !email || !firstName || !lastName || !submissionId) return

    setIsSubmitDialogOpen(true)
  }, [evaluation, uniqueCode, email, firstName, lastName, submissionId])

  // Enviar la evaluación completa
  const handleSubmitEvaluation = useCallback(async () => {
    if (!evaluation || !uniqueCode || !email || !firstName || !lastName || !submissionId) return

    setLoading(true)
    setIsSubmitDialogOpen(false)

    try {
      // Importar las acciones del servidor
      const { saveAnswers, submitEvaluation } = await import('./actions')

      // Guardar todas las respuestas
      // Verificamos nuevamente que submissionId no sea null para satisfacer TypeScript
      if (!submissionId) {
        throw new Error('ID de presentación no disponible')
      }

      const saveResult = await saveAnswers(submissionId, answers)

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Error al guardar las respuestas')
      }

      // Marcar la presentación como enviada
      const submitResult = await submitEvaluation(submissionId)

      if (!submitResult.success) {
        // Verificar si el error es porque la evaluación ya fue enviada
        if (submitResult.error && submitResult.error.includes('ya fue enviada')) {
          console.warn(submitResult.error)
          router.push(`/student/evaluation/success?alreadySubmitted=true&code=${uniqueCode}`)
          return
        } else {
          throw new Error(submitResult.error || 'Error al enviar la evaluación')
        }
      }

      console.log('Evaluación enviada correctamente')
      router.push('/student/evaluation/success')
    } catch (error) {
      console.error('Error al enviar la evaluación:', error)
      console.error('Error al enviar la evaluación. Por favor, intenta de nuevo.')
      setLoading(false)
    }
  }, [evaluation, answers, uniqueCode, email, firstName, lastName, submissionId, router])

  // Referencia para la función de envío de evaluación para evitar dependencias circulares
  const handleSubmitEvaluationRef = useRef(handleSubmitEvaluation);

  // Actualizar la referencia cuando cambie la función
  useEffect(() => {
    handleSubmitEvaluationRef.current = handleSubmitEvaluation;
  }, [handleSubmitEvaluation]);

  // Temporizador para el tiempo restante
  useEffect(() => {
    if (!evaluation) return

    const endTime = new Date(evaluation.endTime).getTime()
    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, endTime - now)
      setTimeRemaining(diff)

      if (diff <= 0) {
        // Tiempo agotado, enviar automáticamente
        handleSubmitEvaluationRef.current();
      }
    }

    updateTimer()
    const timerId = setInterval(updateTimer, 1000)

    return () => clearInterval(timerId)
  }, [evaluation]) // Eliminamos handleSubmitEvaluation de las dependencias

  // Detector de cambio de pestaña o pérdida de foco
  useEffect(() => {
    if (!submissionId) return;

    const handleVisibilityChange = async () => {
      // Use refs to access current state values
      const currentAnswers = answersRef.current;
      const currentIndex = currentQuestionIndexRef.current;
      const currentAnswer = currentAnswers[currentIndex];

      if (document.hidden) {
        const newLeaveTime = Date.now();
        setLeaveTime(newLeaveTime);

        setFraudAttempts(prevFraudAttempts => {
          const nextFraudValue = prevFraudAttempts + 1;
          if (currentAnswer && submissionId) {
            import('./actions').then(({ saveAnswer }) => {
              saveAnswer(
                submissionId,
                currentAnswer.questionId,
                currentAnswer.answer,
                currentAnswer.score ?? undefined,
                nextFraudValue,
                timeOutsideEvalRef.current
              ).catch(error => console.error('Error al guardar intento de fraude:', error));
            });
          }
          return nextFraudValue;
        });

      } else if (leaveTimeRef.current !== null) {
        const timeAway = Math.floor((Date.now() - leaveTimeRef.current) / 1000);
        setLeaveTime(null);

        setTimeOutsideEval(prevTimeOutsideEval => {
          const nextTimeOutsideEval = prevTimeOutsideEval + timeAway;

          if (currentAnswer && submissionId) {
            import('./actions').then(({ saveAnswer }) => {
              saveAnswer(
                submissionId,
                currentAnswer.questionId,
                currentAnswer.answer,
                currentAnswer.score ?? undefined,
                fraudAttemptsRef.current,
                nextTimeOutsideEval
              ).catch(error => console.error('Error al guardar tiempo fuera de la evaluación:', error));
            });
          }
          return nextTimeOutsideEval;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [submissionId, setLeaveTime, setFraudAttempts, setTimeOutsideEval]);

  // Formatear el tiempo restante
  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) return '00:00:00'

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Manejar cambios en las respuestas
  const handleAnswerChange = async (value: string) => {
    const updatedAnswers = [...answers]
    updatedAnswers[currentQuestionIndex].answer = value
    updatedAnswers[currentQuestionIndex].evaluated = false
    updatedAnswers[currentQuestionIndex].score = null
    setAnswers(updatedAnswers)
    setEvaluationResult(null)

    // Guardar la respuesta en la base de datos si tenemos un ID de presentación
    if (submissionId) {
      try {
        const { saveAnswer } = await import('./actions')
        await saveAnswer(
          submissionId,
          updatedAnswers[currentQuestionIndex].questionId,
          value,
          undefined,
          fraudAttempts, // Pasar el contador de intentos de fraude
          timeOutsideEval // Pasar el tiempo acumulado fuera de la evaluación
        )
      } catch (error) {
        console.error('Error al guardar la respuesta:', error)
        // No mostramos error al usuario para no interrumpir su experiencia
      }
    }
  }

  // Navegar a la pregunta anterior
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      setEvaluationResult(null)
    }
  }

  // Navegar a la pregunta siguiente
  const goToNextQuestion = () => {
    if (evaluation && currentQuestionIndex < evaluation.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1

      setCurrentQuestionIndex(nextIndex)
      setEvaluationResult(null)
    }
  }

  // Navegar a una pregunta específica
  const goToQuestion = (index: number) => {
    if (evaluation && index >= 0 && index < evaluation.questions.length) {

      setCurrentQuestionIndex(index)
      setEvaluationResult(null)
    }
  }

  // Evaluar la respuesta actual con Gemini
  const evaluateCurrentAnswer = async () => {
    if (!evaluation || !submissionId) return

    const currentQuestion = evaluation.questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestionIndex]

    if (!currentAnswer.answer.trim()) {
      console.warn('Por favor, proporciona una respuesta antes de evaluar')
      return
    }

    // Verificar si el botón está en enfriamiento (tanto para evaluación inicial como reevaluación)
    if (buttonCooldown > 0) {
      // No mostramos toast, el contador se muestra directamente en el botón
      return
    }

    setEvaluating(true)
    setShowAlert(true) // Aseguramos que la alerta sea visible para la nueva evaluación

    try {
      if (currentQuestion.type === 'CODE') {
        const language = JSON.parse(currentQuestion.answer || '{}').language || 'javascript'

        const result = await evaluateStudentCode(
          currentQuestion.text,
          currentAnswer.answer,
          language
        )

        // Actualizar el estado de la respuesta
        const updatedAnswers = [...answers]
        updatedAnswers[currentQuestionIndex].evaluated = true
        updatedAnswers[currentQuestionIndex].score = result.grade
        setAnswers(updatedAnswers)

        // Guardar la respuesta evaluada en la base de datos
        const { saveAnswer } = await import('./actions')
        const saveResult = await saveAnswer(
          submissionId,
          currentAnswer.questionId,
          currentAnswer.answer,
          result.grade !== undefined ? result.grade : undefined
        )

        if (!saveResult.success) {
          console.error('Error al guardar la respuesta evaluada:', saveResult.error)
          // No mostramos error al usuario para no interrumpir su experiencia
        }

        // Mostrar resultado de la evaluación
        setEvaluationResult({
          success: result.isCorrect,
          message: currentAnswer.evaluated ? 'Respuesta reevaluada' : (result.isCorrect ? '¡Respuesta correcta!' : 'La respuesta necesita mejoras'),
          details: result.feedback,
          grade: result.grade
        })
      } else {
        // Para preguntas de texto, evaluamos con IA usando la función específica para texto
        const result = await evaluateStudentText(
          currentQuestion.text,
          currentAnswer.answer
        )

        // Actualizar el estado de la respuesta
        const updatedAnswers = [...answers]
        updatedAnswers[currentQuestionIndex].evaluated = true
        updatedAnswers[currentQuestionIndex].score = result.grade
        setAnswers(updatedAnswers)

        // Guardar la respuesta evaluada en la base de datos
        const { saveAnswer } = await import('./actions')
        const saveResult = await saveAnswer(
          submissionId,
          currentAnswer.questionId,
          currentAnswer.answer,
          result.grade !== undefined ? result.grade : undefined
        )

        if (!saveResult.success) {
          console.error('Error al guardar la respuesta evaluada:', saveResult.error)
          // No mostramos error al usuario para no interrumpir su experiencia
        }

        setEvaluationResult({
          success: result.isCorrect,
          message: currentAnswer.evaluated ? 'Respuesta reevaluada' : (result.isCorrect ? '¡Respuesta aceptable!' : 'La respuesta necesita mejoras'),
          details: result.feedback,
          grade: result.grade
        })
      }

      // Iniciar el temporizador de enfriamiento (10 segundos)
      setButtonCooldown(10)
      const cooldownTimer = setInterval(() => {
        setButtonCooldown(prev => {
          if (prev <= 1) {
            clearInterval(cooldownTimer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (error) {
      console.error('Error al evaluar la respuesta:', error)
      console.error('Error al evaluar la respuesta. Por favor, intenta de nuevo.')
    } finally {
      setEvaluating(false)
    }
  }



  // Determinar el estilo de la alerta según la calificación o el resultado de evaluación
  const getAlertStyling = (result: { success: boolean; grade?: number }) => {
    let bgColorClass = ''
    let icon = null
    const iconClasses = 'h-6 w-6 mr-3 text-white' // Iconos más grandes y con más margen

    // Si hay una calificación, usamos eso para determinar el estilo
    if (result.grade !== undefined) {
      if (result.grade >= 0 && result.grade < 3) {
        bgColorClass = 'bg-red-600' // Tono de rojo más moderno
        icon = <AlertCircle className={iconClasses} />
      } else if (result.grade >= 3 && result.grade < 4) {
        bgColorClass = 'bg-amber-500' // Tono de amarillo (ámbar) más moderno
        icon = <AlertCircle className={iconClasses} />
      } else if (result.grade >= 4 && result.grade <= 5) {
        bgColorClass = 'bg-emerald-500' // Tono de verde (esmeralda) más moderno
        icon = <CheckCircle className={iconClasses} />
      }
    } else {
      // Si no hay calificación, usamos el éxito/fracaso para determinar el estilo
      bgColorClass = result.success ? 'bg-emerald-500' : 'bg-amber-500'
      icon = result.success ? <CheckCircle className={iconClasses} /> : <AlertCircle className={iconClasses} />
    }

    // Añadir clase para el contador de fraude
    const fraudClass = fraudAttempts > 0 ? 'flex justify-between items-center' : ''

    return {
      alertClass: `p-5 rounded-lg shadow-md text-white ${bgColorClass} mb-2 ${fraudClass}`,
      iconComponent: icon,
      titleClass: "text-xl font-semibold mb-1.5 text-white",
      descriptionClass: "text-sm mt-1 text-white opacity-90 whitespace-pre-wrap"
    }
  }

  // Obtener el color del círculo según el estado de la respuesta
  const getQuestionStatusColor = (index: number) => {
    const answer = answers[index]

    if (!answer || !answer.answer.trim()) {
      return {
        bgColor: 'bg-gray-300 dark:bg-gray-700 border border-gray-400 dark:border-gray-600',
        tooltip: 'Sin responder',
        score: null
      }
    }

    if (!answer.evaluated) {
      return {
        bgColor: 'bg-amber-400 dark:bg-amber-600 border border-amber-500 dark:border-amber-700 animate-pulse',
        tooltip: 'Respondida pero no evaluada',
        score: null
      }
    }

    // Usar los mismos rangos y colores que en las alertas de respuestas
    if (answer.score !== null && answer.score !== undefined) {
      if (answer.score >= 4 && answer.score <= 5) {
        return {
          bgColor: 'bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-700',
          tooltip: 'Correcta',
          score: answer.score
        }
      } else if (answer.score >= 3 && answer.score < 4) {
        return {
          bgColor: 'bg-amber-500 dark:bg-amber-600 border border-amber-600 dark:border-amber-700',
          tooltip: 'Aceptable',
          score: answer.score
        }
      } else {
        return {
          bgColor: 'bg-red-600 dark:bg-red-700 border border-red-700 dark:border-red-800',
          tooltip: 'Necesita mejoras',
          score: answer.score
        }
      }
    }

    return {
      bgColor: 'bg-rose-500 dark:bg-rose-600 border border-rose-600 dark:border-rose-700',
      tooltip: 'Necesita mejoras',
      score: null
    }
  }

  // Renderizar pantalla de evaluación expirada
  const renderExpiredEvaluation = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center text-red-600 dark:text-red-500">
              Evaluación no disponible
            </CardTitle>
            <CardDescription className="text-center">
              Esta evaluación ya no está disponible porque la fecha y hora límite ha expirado o aún no ha comenzado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Clock className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-center mb-6">
              Por favor, contacta con tu profesor si necesitas acceso a esta evaluación.
            </p>
            <Button
              onClick={() => router.push('/student')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Volver a ingresar código
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (isEvaluationExpired) {
    return renderExpiredEvaluation();
  }

  if (!evaluation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">No se pudo cargar la evaluación. Por favor, verifica el código e intenta de nuevo.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/student')}>Volver</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const currentQuestion = evaluation.questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex]

  // Determinar el lenguaje de programación para preguntas de código
  let language = 'javascript'
  if (currentQuestion.type === 'CODE' && currentQuestion.answer) {
    try {
      const answerData = JSON.parse(currentQuestion.answer)
      language = answerData.language || 'javascript'
    } catch (e) {
      console.error('Error al parsear el campo answer:', e)
    }
  }

  const alertStyling = evaluationResult ? getAlertStyling(evaluationResult) : null

  // Función para abrir el modal de ayuda
  const handleOpenHelpModal = () => {
    if (evaluation?.helpUrl) {
      setIsHelpModalOpen(true);
    } else {
      console.info('No hay recursos de ayuda disponibles para esta evaluación.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      {/* Barra superior con información y controles */}
      <div className="flex justify-between items-center p-3 bg-card shadow-md flex-shrink-0 border-b">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-bold">{evaluation.title}</h1>
            <p className="text-xs text-muted-foreground">{firstName} {lastName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Contenedor principal para elementos informativos con altura uniforme */}
          <div className="flex items-center space-x-2">
            {/* Nota calculada */}
            {answers.some(a => a.evaluated) && (
              <div className="flex items-center gap-1 h-9 bg-primary/10 px-3 rounded-md">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  Nota: {(answers.reduce((sum, a) => sum + (a.score || 0), 0) / evaluation.questions.length).toFixed(1)}/5.0
                </span>
              </div>
            )}

            {/* Indicador de progreso */}
            <div className="flex items-center gap-1 h-9 bg-primary/10 px-3 rounded-md">
              <BarChart className="h-4 w-4 text-primary" />
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Progreso</span>
                  <span className="text-xs font-semibold">{calculateProgress()}%</span>
                </div>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Temporizador - Con la misma altura que los otros elementos */}
            <div className="flex items-center h-9 gap-1 bg-primary/10 px-3 rounded-md">
              <Clock className="h-4 w-4 text-primary" />
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Tiempo</span>
                  <span className="text-xs font-semibold">{formatTimeRemaining()}</span>
                </div>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${timeRemaining ? (timeRemaining / (new Date(evaluation.endTime).getTime() - new Date(evaluation.startTime).getTime())) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Alerta de intentos de fraude y tiempo fuera */}
            {(fraudAttempts > 0 || timeOutsideEval > 0) && (
              <div className="flex items-center h-9 bg-red-700 px-3 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-1 text-white" />
                <span className="text-white text-sm font-medium">
                  {fraudAttempts > 0 && `Intentos de fraude: ${fraudAttempts}`}
                  {fraudAttempts > 0 && timeOutsideEval > 0 && " | "}
                  {timeOutsideEval > 0 && `Tiempo fuera: ${Math.floor(timeOutsideEval / 60)}m ${timeOutsideEval % 60}s`}
                </span>
              </div>
            )}
          </div>

          {/* Separador vertical */}
          <div className="h-9 border-l mx-1"></div>

          {/* Contenedor para botones con altura uniforme */}
          <div className="flex items-center space-x-2">
            {/* Botón de pantalla completa eliminado */}

            {/* Botón de ayuda para la evaluación general */}
            <Button
              size="sm"
              variant="default"
              onClick={handleOpenHelpModal}
              className="gap-1 h-9"
              title="Ver recursos de ayuda"
              disabled={!evaluation?.helpUrl}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Ayuda</span>
            </Button>

            {/* Botón de ayuda para la pregunta específica */}
            {currentQuestion.helpUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsHelpModalOpen(true)}
                className="gap-1 h-9"
                title="Ver recursos de ayuda para esta pregunta"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Ayuda Pregunta</span>
              </Button>
            ) : null}

            {/* Botón de enviar evaluación */}
            <Button
              size="sm"
              onClick={openSubmitDialog}
              disabled={loading}
              className="gap-1 h-9"
            >
              <Send className="h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Resultado de la evaluación - Ahora aparece antes del contenido principal */}
      {evaluationResult && showAlert && (
        <div className="px-4 py-3 flex-shrink-0">
          {alertStyling ? (
            <div className={alertStyling.alertClass}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {alertStyling.iconComponent}
                  <div>
                    <div className={alertStyling.titleClass}>
                      {evaluationResult.message}
                      {evaluationResult.grade !== undefined && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
                          {evaluationResult.grade.toFixed(1)}/5.0
                        </span>
                      )}
                    </div>
                    {evaluationResult.details && (
                      <div className={alertStyling.descriptionClass}>
                        {evaluationResult.details}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowAlert(false)}
                  className="text-white opacity-70 hover:opacity-100 transition-opacity"
                  aria-label="Cerrar alerta"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <Alert variant="default" className="relative border shadow-md bg-card">
              <div className="flex justify-between items-start w-full">
                <div className="flex items-center gap-2">
                  {evaluationResult.success ?
                    <CheckCircle className="h-5 w-5 text-green-500" /> :
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  }
                  <div>
                    <AlertTitle className="text-base font-medium">{evaluationResult.message}</AlertTitle>
                    {evaluationResult.details && (
                      <AlertDescription className="text-sm mt-1 whitespace-pre-wrap">{evaluationResult.details}</AlertDescription>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowAlert(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors ml-2 flex-shrink-0"
                  aria-label="Cerrar alerta"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </Alert>
          )}
        </div>
      )}

      {/* Contenido principal - Usa flex-grow para ocupar todo el espacio disponible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 flex-grow overflow-hidden">
        {/* Columna izquierda: Visualizador de Markdown */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-0 px-4 flex-shrink-0 mb-2">
            <CardTitle className="flex justify-between items-center text-base">
              <span>Pregunta {currentQuestionIndex + 1}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${currentQuestion.type === 'CODE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                {currentQuestion.type === 'CODE' ? 'Código' : 'Texto'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-auto p-2 min-h-0">
            <div data-color-mode={theme === 'dark' ? 'dark' : 'light'} className="h-full rounded-lg">
              <MDPreview
                source={currentQuestion.text}
                style={{
                  padding: '0.5rem',
                  height: '100%',
                  borderRadius: '0.5rem',
                  color: 'var(--foreground)',
                  backgroundColor: theme === 'dark' ? 'var(--secondary)' : 'var(--background)',
                  overflowY: 'auto'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: Editor de respuesta */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-0 px-4 flex-shrink-0">
            <CardTitle className="flex justify-between items-center text-base">
              <span>Tu Respuesta</span>
              <div className="flex items-center gap-2">
                {currentQuestion.type === 'CODE' && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label || language}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="default"
                  onClick={evaluateCurrentAnswer}
                  disabled={evaluating || !currentAnswer.answer.trim()}
                  className="h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 animate-pulse hover:animate-none"
                >
                  {evaluating ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Evaluando...
                    </span>
                  ) : buttonCooldown > 0 ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentAnswer.evaluated ? "Reevaluar" : "Evaluar"} ({buttonCooldown}s)
                    </span>
                  ) : currentAnswer.evaluated ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Reevaluar con IA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      Evaluar con IA
                    </span>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-2 min-h-0">
            {currentQuestion.type === 'CODE' ? (
              <div className="h-full">
                <MonacoEditor
                  height="100%"
                  language={language}
                  value={currentAnswer.answer}
                  onChange={(value) => handleAnswerChange(value || '')}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 16,
                    wordWrap: 'on',
                    mouseWheelZoom: true,
                    roundedSelection: true,
                    readOnly: false,
                    contextmenu: true
                  }}
                  theme={theme === 'dark' ? monokaiThemeName : lightThemeName}
                  defaultValue=""
                  className="rounded-lg overflow-hidden"
                  loading={<div className="flex items-center justify-center h-full w-full bg-black rounded-lg">Cargando editor...</div>}
                  onMount={(editor, monaco) => {
                    // Prevenir copiar y pegar con atajos de teclado
                    editor.onKeyDown((e) => {
                      // Prevenir Ctrl+C, Ctrl+V, Ctrl+X
                      if ((e.ctrlKey || e.metaKey) && (e.keyCode === monaco.KeyCode.KeyC || e.keyCode === monaco.KeyCode.KeyV || e.keyCode === monaco.KeyCode.KeyX)) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                      }
                    });
                  }}
                />
              </div>
            ) : (
              <Textarea
                placeholder="Escribe tu respuesta aquí..."
                value={currentAnswer.answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="resize-none h-full rounded-lg bg-card text-card-foreground border border-border focus:ring-2 focus:ring-primary focus:border-primary"
                style={{
                  width: '100%',
                  overflowY: 'auto',
                  display: 'block',
                  borderRadius: '0.5rem',
                  fontSize: '1.2rem',
                }}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Prevenir Ctrl+C, Ctrl+V, Ctrl+X
                  if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                    e.preventDefault();
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer con controles de paginación */}
      <div className="flex justify-center items-center p-4 bg-card shadow-sm border-t border-border flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Botones de navegación */}
          <Button
            size="sm"
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>

          {/* Paginación con tooltips */}
          <div className="flex items-center gap-2">
            {evaluation.questions.map((_, index) => {
              const statusStyle = getQuestionStatusColor(index);
              return (
                <TooltipProvider key={index}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => goToQuestion(index)}
                        className={`relative flex items-center justify-center h-8 w-8 rounded-full ${statusStyle.bgColor} shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 ease-in-out`}
                        aria-label={`Pregunta ${index + 1}: ${statusStyle.tooltip}`}
                      >
                        {/* Círculo interno (número de pregunta) */}
                        <div className={`absolute inset-1 flex items-center justify-center rounded-full ${currentQuestionIndex === index ? 'bg-primary text-primary-foreground font-medium' : 'bg-blue-600 text-white'} transition-colors duration-200 ease-in-out`}>
                          <span className="text-xs font-semibold">{index + 1}</span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs font-medium">
                      <p>{statusStyle.tooltip}</p>
                      {statusStyle.score !== null && (
                        <p className="font-semibold mt-1">Nota: {statusStyle.score.toFixed(1)}/5.0</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex === evaluation.questions.length - 1}
            className="flex items-center gap-1"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modal de ayuda con iframe a pantalla completa */}
      {evaluation && isHelpModalOpen && (
        <ModalIframe
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          url={currentQuestion.helpUrl || evaluation.helpUrl || ''}
          title="Recursos de ayuda"
          fullScreen={true}
        />
      )}



      {/* Modal de confirmación para enviar evaluación */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envío de evaluación</AlertDialogTitle>
            <AlertDialogDescription>
              {answers.filter(a => !a.answer.trim()).length > 0 ? (
                <>
                  <p className="mb-2">Tienes <span className="font-bold text-destructive">{answers.filter(a => !a.answer.trim()).length} pregunta(s) sin responder</span>.</p>
                  <p>Una vez enviada la evaluación, no podrás modificar tus respuestas. ¿Estás seguro de que deseas enviar la evaluación?</p>
                </>
              ) : (
                <p>Una vez enviada la evaluación, no podrás modificar tus respuestas. ¿Estás seguro de que deseas enviar la evaluación?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitEvaluation} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>Enviar evaluación</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

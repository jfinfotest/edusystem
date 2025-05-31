// Eliminamos 'use client' ya que este archivo se usa en server actions

import { GoogleGenAI } from "@google/genai";

interface ReportResult {
  overallFeedback: string;
  strengths: string[];
  areasForImprovement: string[];
  grade: number; // Nota final de 0.0 a 5.0
  congratulationMessage?: string; // Mensaje de felicitación si la nota es alta
  recommendationMessage?: string; // Mensaje de recomendación si la nota es baja
}

interface AnswerSummary {
  questionText: string;
  questionType: string; // 'CODE' o 'TEXT'
  studentAnswer: string;
  score: number | null;
  language?: string; // Solo para preguntas de código
}

/**
 * Servicio para generar reportes de resultados utilizando Google Gemini
 * @param studentName - Nombre completo del estudiante
 * @param evaluationTitle - Título de la evaluación
 * @param answers - Resumen de las respuestas del estudiante con sus calificaciones
 * @param averageScore - Calificación promedio obtenida
 * @param fraudAttempts - Número de intentos de fraude detectados
 * @returns Objeto con el reporte generado incluyendo retroalimentación, fortalezas, áreas de mejora y mensajes personalizados
 */
export async function generateEvaluationReport(
  studentName: string,
  evaluationTitle: string,
  answers: AnswerSummary[],
  averageScore: number,
  fraudAttempts: number
): Promise<ReportResult> {
  try {
    // Inicializar la API de Google Gemini
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('API_KEY no configurada para Google Gemini');
      return {
        overallFeedback: 'No se pudo generar el reporte debido a un error de configuración.',
        strengths: [],
        areasForImprovement: ['Contacta al administrador del sistema para obtener ayuda.'],
        grade: averageScore
      };
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    // Usar el modelo gemini-2.0-flash para reportes rápidos
    const model = "gemini-2.0-flash";

    // Preparar el resumen de respuestas para el prompt
    const answersDetail = answers.map((answer, index) => {
      return `
      Pregunta ${index + 1} (${answer.questionType}):
      ${answer.questionText}

      Respuesta del estudiante:
      ${answer.studentAnswer}

      Calificación: ${answer.score !== null ? answer.score : 'No evaluada'}/5.0
      `;
    }).join('\n');

    // Crear el prompt para la generación del reporte
    const prompt = `
    Eres un asistente educativo que genera reportes detallados de evaluaciones académicas. 
    Genera un reporte completo para el siguiente estudiante basado en sus respuestas y calificaciones.

    ESTUDIANTE: ${studentName}
    EVALUACIÓN: ${evaluationTitle}
    CALIFICACIÓN PROMEDIO: ${averageScore.toFixed(1)}/5.0
    INTENTOS DE FRAUDE DETECTADOS: ${fraudAttempts}

    DETALLE DE RESPUESTAS:
    ${answersDetail}

    Basado en esta información, genera un reporte completo que incluya:
    1. Una retroalimentación general sobre el desempeño del estudiante
    2. Las principales fortalezas demostradas
    3. Áreas específicas que necesitan mejora
    4. Un mensaje personalizado de felicitación si la calificación es buena (≥ 4.0) o recomendaciones constructivas si la calificación es baja (< 3.0)

    Ten en cuenta los intentos de fraude en tu evaluación si los hubiera.

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "overallFeedback": string, // Retroalimentación general sobre el desempeño
      "strengths": string[], // Lista de fortalezas identificadas (al menos 2)
      "areasForImprovement": string[], // Lista de áreas que necesitan mejora (al menos 2)
      "grade": number, // La calificación final (debe ser igual a ${averageScore.toFixed(1)})
      "congratulationMessage": string, // Mensaje de felicitación (solo si la nota es ≥ 4.0)
      "recommendationMessage": string // Mensaje de recomendación (solo si la nota es < 3.0)
    }
    `;

    // Generar la respuesta usando la API
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      // generationConfig: {
      //   temperature: 0.2, // Baja temperatura para respuestas más consistentes
      //   topP: 0.8,
      //   topK: 40,
      //   maxOutputTokens: 2048
      // }
    });
    
    const text = response.text || '';
    console.log('Respuesta de Gemini:', text);

    // Extraer el JSON de la respuesta
    try {
      // Primero intentamos parsear directamente la respuesta
      try {
        const reportResult = JSON.parse(text) as ReportResult;
        console.log('JSON parseado directamente:', reportResult);
        return reportResult;
      } catch (directError) {
        console.log(directError);        
        console.log('No se pudo parsear directamente, intentando extraer JSON de la respuesta');
        
        // Si falla, intentamos extraer el JSON usando regex
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonText = jsonMatch[0];
          console.log('JSON extraído con regex:', jsonText);
          const reportResult = JSON.parse(jsonText) as ReportResult;
          return reportResult;
        } else {
          throw new Error('No se pudo encontrar un objeto JSON en la respuesta');
        }
      }
    } catch (error) {
      console.error('Error al procesar la respuesta JSON:', error);
      console.error('Texto de respuesta recibido:', text);
    }

    // Si no se pudo extraer un JSON válido, devolver un reporte básico
    return {
      overallFeedback: `${studentName} ha completado la evaluación "${evaluationTitle}" con una calificación de ${averageScore.toFixed(1)}/5.0.`,
      strengths: ['Completó la evaluación'],
      areasForImprovement: ['Revisar el material del curso para mejorar en futuras evaluaciones'],
      grade: averageScore
    };
  } catch (error) {
    console.error('Error al generar el reporte de evaluación:', error);
    return {
      overallFeedback: 'Ocurrió un error al generar el reporte de evaluación.',
      strengths: [],
      areasForImprovement: ['Intenta ver tus resultados más tarde.'],
      grade: averageScore
    };
  }
}
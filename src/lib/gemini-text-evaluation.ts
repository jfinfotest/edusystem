'use client';

import { GoogleGenAI } from "@google/genai";

interface EvaluationResult {
  isCorrect: boolean;
  feedback: string;
  grade?: number; // Nota de 0.0 a 5.0
}

/**
 * Servicio para evaluar respuestas de texto de estudiantes utilizando Google Gemini
 * @param questionText - El texto de la pregunta que se está evaluando
 * @param studentAnswer - La respuesta de texto escrita por el estudiante
 * @returns Objeto con resultado de evaluación (correcto/incorrecto), retroalimentación y calificación
 */
export async function evaluateStudentText(
  questionText: string,
  studentAnswer: string
): Promise<EvaluationResult> {
  try {
    // Verificar que tenemos texto para evaluar
    if (!studentAnswer || studentAnswer.trim() === '') {
      return {
        isCorrect: false,
        feedback: 'Por favor, escribe una respuesta para evaluar.'
      };
    }

    // Inicializar la API de Google Gemini
    // NOTA: En producción, esta clave debe estar en variables de entorno
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('API_KEY no configurada para Google Gemini');
      return {
        isCorrect: false,
        feedback: 'Error de configuración del sistema. Contacta al administrador.'
      };
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    // Usar el modelo gemini-2.0-flash para evaluaciones más rápidas
    const model = "gemini-2.0-flash";

    // Crear el prompt para la evaluación
    const prompt = `
    Eres un evaluador de respuestas de texto para estudiantes. Evalúa la siguiente respuesta basada en la pregunta proporcionada.

    PREGUNTA:
    ${questionText}

    RESPUESTA DEL ESTUDIANTE:
    ${studentAnswer}

   
    Evalúa si la respuesta responde correctamente a la pregunta. Proporciona retroalimentación constructiva y asigna una nota de 0.0 a 5.0 según la calidad de la respuesta. No des la respuesta completa, solo pistas o sugerencias si hay errores. Si está correcto, felicita al estudiante.



    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "isCorrect": boolean, // true si la respuesta es correcta o aceptable, false si no lo es
      "feedback": string // retroalimentación constructiva, sugerencias o felicitación
      "grade": number // nota de 0.0 a 5.0
    }
    `;

    // Generar la respuesta usando la nueva sintaxis de la API
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });
    
    const text = response.text || '';

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const evaluationResult = JSON.parse(jsonMatch[0]) as EvaluationResult;
        return evaluationResult;
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
      }
    }

    // Si no se pudo extraer un JSON válido, devolver un mensaje genérico
    return {
      isCorrect: false,
      feedback: 'No se pudo evaluar tu respuesta. Por favor, inténtalo de nuevo.'
    };
  } catch (error) {
    console.error('Error al evaluar la respuesta de texto:', error);
    return {
      isCorrect: false,
      feedback: 'Ocurrió un error al evaluar tu respuesta. Por favor, inténtalo de nuevo más tarde.'
    };
  }
}
'use client';

import { GoogleGenAI } from "@google/genai";

interface EvaluationResult {
  isCorrect: boolean;
  feedback: string;
  grade?: number; // Nota de 0.0 a 5.0
}

/**
 * Servicio para evaluar código de estudiantes utilizando Google Gemini
 * @param questionText - El texto de la pregunta que se está evaluando
 * @param studentCode - El código escrito por el estudiante
 * @param language - El lenguaje de programación del código
 * @returns Objeto con resultado de evaluación (correcto/incorrecto) y retroalimentación
 */
export async function evaluateStudentCode(
  questionText: string,
  studentCode: string,
  language: string
): Promise<EvaluationResult> {
  try {
    // Verificar que tenemos código para evaluar
    if (!studentCode || studentCode.trim() === '') {
      return {
        isCorrect: false,
        feedback: 'Por favor, escribe algún código para evaluar.'
      };
    }

    // Inicializar la API de Google Gemini   
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('API_KEY no configurada para Google Gemini');
      return {
        isCorrect: false,
        feedback: 'Error de configuración del sistema. Contacta al administrador.'
      };
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    // Usar el modelo gemini-2.0-flash 
    const model = "gemini-2.0-flash";

    // Crear el prompt para la evaluación
    const prompt = `
    Eres un evaluador de código para estudiantes. Evalúa el siguiente código basado en la pregunta proporcionada.

    PREGUNTA:
    ${questionText}

    CÓDIGO DEL ESTUDIANTE (${language}):
    ${studentCode}

    Evalúa si el código responde correctamente a la pregunta. Proporciona retroalimentación constructiva y asigna una nota de 0.0 a 5.0 según la calidad de la respuesta. No des la respuesta completa, solo pistas o sugerencias si hay errores. Si está correcto, felicita al estudiante.

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "isCorrect": boolean, // true si la respuesta es correcta, false si no lo es
      "feedback": string // retroalimentación constructiva, pistas o felicitación
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
      feedback: 'No se pudo evaluar tu código. Por favor, inténtalo de nuevo.'
    };
  } catch (error) {
    console.error('Error al evaluar el código:', error);
    return {
      isCorrect: false,
      feedback: 'Ocurrió un error al evaluar tu código. Por favor, inténtalo de nuevo más tarde.'
    };
  }
}

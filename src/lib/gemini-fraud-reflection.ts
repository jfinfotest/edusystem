'use client';

import { GoogleGenAI } from "@google/genai";

interface FraudReflectionResult {
  title: string;
  message: string;
  suggestion: string;
}

/**
 * Servicio para generar mensajes de reflexión cuando se detectan intentos de fraude
 * @param fraudType - El tipo de fraude detectado (cambio de pestaña, uso de teclas sospechosas, etc.)
 * @param fraudCount - El número de intentos de fraude detectados hasta el momento
 * @returns Objeto con título, mensaje de reflexión y sugerencia para el estudiante
 */
export async function generateFraudReflection(
  fraudType: string,
  fraudCount: number
): Promise<FraudReflectionResult> {
  try {
    // Inicializar la API de Google Gemini
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('API_KEY no configurada para Google Gemini');
      return {
        title: 'Integridad Académica',
        message: 'Hemos detectado un comportamiento que podría comprometer la integridad de la evaluación.',
        suggestion: 'Por favor, continúa la evaluación sin utilizar recursos externos no autorizados.'
      };
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });

    // Usar el modelo gemini-2.0-flash para respuestas rápidas
    const model = "gemini-2.0-flash";

    // Adaptar el mensaje según el número de intentos
    let severityLevel = "bajo";
    if (fraudCount > 3) {
      severityLevel = "medio";
    } else if (fraudCount > 5) {
      severityLevel = "alto";
    }

    // Crear el prompt para la generación del mensaje
    const prompt = `
    Eres un asistente educativo que promueve la integridad académica. Genera un mensaje reflexivo único y profundo para un estudiante que ha realizado una acción que podría considerarse un intento de fraude durante una evaluación en línea.

    TIPO DE ACCIÓN DETECTADA:
    ${fraudType}

    NÚMERO DE INTENTOS DETECTADOS:
    ${fraudCount}

    NIVEL DE SEVERIDAD:
    ${severityLevel}

    INSTRUCCIONES ESPECÍFICAS:
    - Genera un mensaje reflexivo ÚNICO y DIFERENTE cada vez, evitando frases genéricas o repetitivas
    - Incluye una frase filosófica o cita inspiradora sobre la integridad, el conocimiento o la ética
    - Adapta el tono según el nivel de severidad (bajo: educativo, medio: reflexivo, alto: serio pero constructivo)
    - El mensaje debe invitar a la introspección sobre el valor real del aprendizaje y el conocimiento
    - Evita un tono acusatorio, enfócate en el crecimiento personal y los valores académicos

    Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
    {
      "title": string, // Título breve para el modal (máximo 50 caracteres)
      "message": string, // Mensaje principal de reflexión (100-200 caracteres) - DEBE ser una frase reflexiva única
      "suggestion": string // Sugerencia constructiva (máximo 100 caracteres)
    }
    `;

    // Generar la respuesta usando la API
    // Crea simulacion de respuesta para pruebas
    // const response = { text: '{"title":"Reflexión sobre el Fraude","message":"La acción que has realizado podría considerarse un intento de fraude. Recuerda que el conocimiento es poderoso, y debes seguir tus propios aprendizajes.","suggestion":"Continúa tu evaluación sin realizar acciones que puedan ser consideradas un fraude."}' };

    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    const text = response.text || '';

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const reflectionResult = JSON.parse(jsonMatch[0]) as FraudReflectionResult;
        return reflectionResult;
      } catch (error) {
        console.error('Error al parsear la respuesta JSON:', error);
      }
    }

    // Si no se pudo extraer un JSON válido, devolver un mensaje predeterminado
    return {
      title: 'Recordatorio de Integridad',
      message: 'Hemos detectado una acción que podría comprometer la integridad de la evaluación.',
      suggestion: 'Recuerda que el verdadero aprendizaje se basa en el esfuerzo honesto.'
    };
  } catch (error) {
    console.error('Error al generar mensaje de reflexión:', error);
    return {
      title: 'Alerta de Integridad',
      message: 'Se ha detectado una acción inusual durante tu evaluación.',
      suggestion: 'Continúa tu evaluación siguiendo las normas establecidas.'
    };
  }
}
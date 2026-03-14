import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'NEUTRAL';
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  confidence: number;
  analysis: string;
  bestHoursSpain: string;
  indicators: { name: string; value: string; signal: string }[];
}

export async function analyzeAsset(symbol: string): Promise<TradingSignal> {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `Actúa como un analista técnico de élite de un fondo de cobertura (Hedge Fund). 
  Realiza un ESTUDIO PROFUNDO Y EXHAUSTIVO del activo "${symbol}" utilizando exclusivamente los 10 indicadores técnicos con mayor tasa de rentabilidad histórica probada:

  1. RSI (Relative Strength Index): Para detectar divergencias y niveles de sobrecompra/sobreventa extrema.
  2. MACD (Moving Average Convergence Divergence): Para identificar cambios de ciclo y cruces de momentum.
  3. Bollinger Bands: Para medir la volatilidad y posibles rupturas de precio.
  4. Cruce de Medias (EMA 20 y SMA 200): Para determinar la tendencia estructural y puntos de inflexión.
  5. Fibonacci Retracements: Para localizar niveles psicológicos de soporte y resistencia institucional.
  6. Ichimoku Cloud: Para un análisis holístico de la tendencia, soporte y momentum futuro.
  7. Stochastic Oscillator: Para filtrar entradas precisas en marcos temporales operativos.
  8. ATR (Average True Range): Para el cálculo exacto de la volatilidad y colocación de Stop Loss.
  9. ADX (Average Directional Index): Para filtrar la fuerza de la tendencia y evitar mercados laterales.
  10. On-Balance Volume (OBV): Para confirmar si el dinero institucional está acumulando o distribuyendo.

  Tu análisis debe ser "a fondo", no superficial. Debes cruzar la información de los indicadores para encontrar confluencias.

  Proporciona una respuesta detallada con:
  - Acción recomendada (BUY, SELL o NEUTRAL).
  - Precio de entrada sugerido (basado en el precio actual real).
  - Stop Loss técnico (basado en ATR o niveles de soporte).
  - Objetivo (Take Profit) basado en extensiones de Fibonacci o resistencias previas.
  - Nivel de confianza (0-100).
  - Un resumen ejecutivo del análisis (Estudio a fondo de la situación actual).
  - Horario óptimo de inversión (Hora de España - CET/CEST).
  - El estado detallado de cada uno de los 10 indicadores.

  IMPORTANTE: Usa herramientas de búsqueda para obtener el estado actual del mercado de ${symbol}.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['BUY', 'SELL', 'NEUTRAL'] },
          entryPrice: { type: Type.STRING },
          stopLoss: { type: Type.STRING },
          takeProfit: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          bestHoursSpain: { type: Type.STRING, description: "Mejores horas para invertir en horario de España" },
          indicators: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                signal: { type: Type.STRING }
              },
              required: ["name", "value", "signal"]
            }
          }
        },
        required: ["action", "entryPrice", "stopLoss", "takeProfit", "confidence", "analysis", "bestHoursSpain", "indicators"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Error parsing AI response", e);
    throw new Error("No se pudo procesar el análisis de la IA.");
  }
}

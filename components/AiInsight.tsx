
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FipeResult } from '../types';

interface Props {
  vehicle: FipeResult;
  location?: string;
}

const AiInsight: React.FC<Props> = ({ vehicle, location }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
          throw new Error('Chave de API ausente na plataforma.');
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const locationContext = location 
          ? `Considere o mercado na região de "${location}".`
          : "Considere o mercado brasileiro.";

        const prompt = `Analise tecnicamente o veículo ${vehicle.brand} ${vehicle.model} ${vehicle.modelYear} (FIPE: ${vehicle.price}). ${locationContext}`;
        
        // Mudança para gemini-3-flash-preview para maior estabilidade e velocidade de resposta
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: "Você é um consultor automotivo profissional. Forneça uma análise curta em 3 parágrafos sobre: 1. Valor de revenda (liquidez); 2. Confiabilidade mecânica; 3. Público-alvo ideal. Seja honesto sobre defeitos crônicos se houver. Responda em português.",
          }
        });

        const text = response.text;
        if (text) {
          setInsight(text);
        } else {
          throw new Error('Resposta vazia da IA.');
        }
      } catch (err: any) {
        console.error('Gemini error:', err);
        setError(err.message === 'Failed to fetch' 
          ? 'Erro de conexão com o servidor de IA.' 
          : 'Não foi possível obter a análise especializada agora.');
      } finally {
        setLoading(false);
      }
    };

    if (vehicle.codeFipe) {
      fetchInsight();
    }
  }, [vehicle.codeFipe, location]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2.5rem] p-8 border border-blue-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">✨</span>
        <h3 className="text-xl font-black text-blue-900 italic tracking-tight">Análise Inteligente {location && `(${location})`}</h3>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-blue-200 rounded-full w-3/4"></div>
          <div className="h-3 bg-blue-200 rounded-full w-full"></div>
          <div className="h-3 bg-blue-200 rounded-full w-5/6"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm font-bold border border-orange-100">
           ⚠️ {error}
        </div>
      ) : (
        <div className="text-blue-800 leading-relaxed text-base md:text-lg prose prose-blue whitespace-pre-wrap font-medium">
          {insight}
        </div>
      )}
    </div>
  );
};

export default AiInsight;

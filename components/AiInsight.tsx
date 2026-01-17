
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect } from 'react';
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
      if (!vehicle.codeFipe) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Inicialização direta conforme diretrizes da SDK
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const locationContext = location 
          ? `Considere o mercado na região de "${location}".`
          : "Considere o mercado brasileiro.";

        const prompt = `Analise tecnicamente o veículo ${vehicle.brand} ${vehicle.model} ${vehicle.modelYear} (FIPE: ${vehicle.price}). ${locationContext}`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: "Você é um consultor automotivo profissional. Forneça uma análise curta em 3 parágrafos sobre: 1. Valor de revenda (liquidez); 2. Confiabilidade mecânica; 3. Público-alvo ideal. Seja honesto sobre defeitos crônicos se houver. Responda em português.",
          },
        });

        // Acessando a propriedade .text diretamente
        const textOutput = response.text;
        
        if (textOutput) {
          setInsight(textOutput);
        } else {
          throw new Error('O modelo não retornou conteúdo de texto.');
        }
      } catch (err: any) {
        console.error('Erro na Gemini API:', err);
        setError('A análise especializada está temporariamente indisponível.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [vehicle.codeFipe, vehicle.price, location]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-blue-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <span className="text-2xl md:text-3xl">✨</span>
        <h3 className="text-lg md:text-xl font-black text-blue-900 italic tracking-tight uppercase">Análise Inteligente</h3>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-2 bg-blue-200 rounded-full w-3/4"></div>
          <div className="h-2 bg-blue-200 rounded-full w-full"></div>
          <div className="h-2 bg-blue-200 rounded-full w-5/6"></div>
        </div>
      ) : error ? (
        <div className="p-3 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-bold border border-orange-100 italic">
           ⚠️ {error}
        </div>
      ) : (
        <div className="text-blue-800 leading-relaxed text-sm md:text-lg prose prose-blue whitespace-pre-wrap font-medium italic">
          {insight}
        </div>
      )}
    </div>
  );
};

export default AiInsight;

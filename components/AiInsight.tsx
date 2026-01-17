
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
      if (!vehicle.codeFipe || !vehicle.price) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Inicialização garantindo que a API KEY do ambiente seja utilizada
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const locationContext = location 
          ? `Considere o mercado na região de "${location}".`
          : "Considere o mercado brasileiro de forma geral.";

        const prompt = `Analise o veículo: ${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}. Preço atual FIPE: ${vehicle.price}. ${locationContext}`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            systemInstruction: "Você é um consultor automotivo expert. Forneça uma análise técnica dividida em 3 pontos rápidos: Liquidez de revenda, Confiabilidade mecânica (pontos fortes/fracos) e Custo-benefício atual. Use tom profissional e direto. Responda estritamente em Português do Brasil.",
            temperature: 0.7,
            topP: 0.95,
          },
        });

        const textOutput = response.text;
        
        if (textOutput) {
          setInsight(textOutput);
        } else {
          throw new Error('Sem resposta da IA.');
        }
      } catch (err: any) {
        console.error('Erro na Gemini API:', err);
        setError('Ocorreu um erro na análise inteligente. Tente novamente em alguns instantes.');
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
        <h3 className="text-lg md:text-xl font-black text-blue-900 italic tracking-tight uppercase">Insight do Especialista IA</h3>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-2.5 bg-blue-200 rounded-full w-3/4"></div>
          <div className="h-2.5 bg-blue-200 rounded-full w-full"></div>
          <div className="h-2.5 bg-blue-200 rounded-full w-5/6"></div>
          <p className="text-[10px] font-bold text-blue-400 uppercase italic animate-bounce mt-2">Processando análise técnica...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-white border border-red-100 rounded-2xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-[11px] font-bold text-red-600 uppercase italic leading-tight">
            {error}
          </p>
        </div>
      ) : (
        <div className="text-blue-800 leading-relaxed text-sm md:text-base prose prose-blue whitespace-pre-wrap font-medium italic">
          {insight}
        </div>
      )}
    </div>
  );
};

export default AiInsight;

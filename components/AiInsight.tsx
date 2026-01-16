
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

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      try {
        // Correct initialization using named parameters and environment variable.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const locationContext = location 
          ? `Considere especificamente o mercado na região de "${location}" para esta análise.`
          : "Considere o mercado nacional brasileiro.";

        const prompt = `Analise de forma analítica e profissional o veículo ${vehicle.brand} ${vehicle.model} ano ${vehicle.modelYear} (Valor FIPE: ${vehicle.price}). 
        ${locationContext}
        Fale sobre:
        1. Tendência de desvalorização para este modelo específico.
        2. Liquidez no mercado de usados na região informada (ou nacional se não informada).
        3. Custo-benefício da manutenção e confiabilidade.
        Responda em português de forma concisa e direta em tópicos curtos.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });

        // Use the .text property directly instead of .text() method.
        setInsight(response.text || 'Não foi possível gerar um insight no momento.');
      } catch (error) {
        console.error('Gemini error:', error);
        setInsight('Ocorreu um erro ao consultar o especialista de IA.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [vehicle, location]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2.5rem] p-8 border border-blue-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">✨</span>
        <h3 className="text-xl font-black text-blue-900 italic tracking-tight">Análise Especializada {location && `(${location})`}</h3>
      </div>
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-blue-200 rounded-full w-3/4"></div>
          <div className="h-3 bg-blue-200 rounded-full w-full"></div>
          <div className="h-3 bg-blue-200 rounded-full w-5/6"></div>
          <div className="h-3 bg-blue-200 rounded-full w-4/6"></div>
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

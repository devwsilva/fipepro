
import React, { useState, useEffect } from 'react';
import { fipeService } from '../services/fipeService';
import { VehicleType, FipeResult } from '../types';

interface Props {
  fipeCode: string;
  yearId: string;
  vehicleType: VehicleType;
}

const PriceHistory: React.FC<Props> = ({ fipeCode, yearId, vehicleType }) => {
  const [history, setHistory] = useState<{ month: string, price: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const references = await fipeService.getReferences();
        // Pegar as 3 últimas referências
        const lastThree = references.slice(0, 3);
        
        const priceData = await Promise.all(
          lastThree.map(async (ref) => {
            try {
              const details = await fipeService.getDetailsByFipe(vehicleType, fipeCode, yearId, ref.code);
              return { month: ref.month, price: details.price };
            } catch {
              return null;
            }
          })
        );

        setHistory(priceData.filter(d => d !== null) as { month: string, price: string }[]);
      } catch (e) {
        console.error("Erro ao carregar histórico:", e);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [fipeCode, yearId, vehicleType]);

  if (loading) return <div className="text-sm text-gray-400 animate-pulse font-bold tracking-widest uppercase">Carregando histórico oficial...</div>;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
        <span className="text-2xl">📊</span> Variação de Preço
      </h3>
      <div className="space-y-5">
        {history.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 rounded-xl px-2 transition-colors">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{item.month}</span>
            <span className="text-xl font-black text-slate-900 tabular-nums">{item.price}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-300 mt-6 font-bold uppercase tracking-widest text-center italic">* Base de dados Parallelum / FIPE Oficial</p>
    </div>
  );
};

export default PriceHistory;


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

  if (loading) return <div className="text-[10px] text-slate-300 animate-pulse font-black tracking-[0.2em] uppercase italic text-center py-4">Consultando Variação Histórica...</div>;

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-base md:text-lg font-black text-slate-800 mb-6 md:mb-8 flex items-center gap-3 uppercase tracking-tight italic">
        <span className="text-xl md:text-2xl">📊</span> Variação de Preço
      </h3>
      <div className="space-y-4 md:space-y-5">
        {history.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-3 md:py-4 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 rounded-xl md:px-2 transition-colors">
            <span className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest">{item.month}</span>
            <span className="text-base md:text-xl font-black text-slate-900 tabular-nums">{item.price}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-slate-300 mt-6 font-bold uppercase tracking-widest text-center italic">* Dados extraídos da base oficial FIPE</p>
    </div>
  );
};

export default PriceHistory;

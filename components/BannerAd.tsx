
import React, { useState, useEffect } from 'react';
import { FipeResult } from '../types';

interface Props {
  vehicle?: FipeResult | null;
}

const BannerAd: React.FC<Props> = ({ vehicle }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (closed || !isVisible) return null;

  const adContent = vehicle 
    ? {
        title: `Proteja seu ${vehicle.brand}!`,
        desc: `Cote agora o seguro para seu ${vehicle.model} com até 30% de desconto exclusivo.`,
        cta: "Simular Seguro",
        color: "from-blue-600 to-indigo-700"
      }
    : {
        title: "Crédito Automotivo PRO",
        desc: "As menores taxas do mercado para financiar seu próximo veículo. Aproveite hoje!",
        cta: "Ver Taxas",
        color: "from-orange-500 to-red-600"
      };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] p-4 animate-in slide-in-from-bottom-full duration-700 ease-out">
      <div className={`max-w-5xl mx-auto bg-gradient-to-r ${adContent.color} text-white rounded-2xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 md:py-3 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/20 backdrop-blur-md relative group`}>
        
        {/* Close Button */}
        <button 
          onClick={() => setClosed(true)}
          className="absolute -top-2 -right-2 bg-slate-900 text-white w-6 h-6 rounded-full text-[10px] flex items-center justify-center border border-white/20 hover:bg-red-600 transition-colors shadow-lg"
        >
          ✕
        </button>

        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="hidden md:flex w-12 h-12 bg-white/20 rounded-full items-center justify-center text-2xl animate-bounce">
            {vehicle ? '🛡️' : '💰'}
          </div>
          <div>
            <h4 className="font-black italic uppercase text-xs md:text-sm tracking-tight leading-none mb-1">
              <span className="bg-white text-slate-900 px-1.5 py-0.5 rounded text-[8px] mr-2 not-italic font-black">AD</span>
              {adContent.title}
            </h4>
            <p className="text-[10px] md:text-xs font-medium text-white/80 max-w-md">
              {adContent.desc}
            </p>
          </div>
        </div>

        <button className="w-full md:w-auto bg-white text-slate-900 px-8 py-2.5 rounded-full font-black text-[10px] md:text-xs uppercase italic hover:bg-slate-100 transition-all active:scale-95 shadow-xl whitespace-nowrap">
          {adContent.cta}
        </button>
      </div>
    </div>
  );
};

export default BannerAd;

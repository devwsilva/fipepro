
import React from 'react';
import { VehicleType } from '../types';

interface Props {
  selected: VehicleType;
  onChange: (type: VehicleType) => void;
}

const VehicleTypeSelector: React.FC<Props> = ({ selected, onChange }) => {
  const options: { id: VehicleType; label: string; icon: string }[] = [
    { id: 'cars', label: 'Carros', icon: '🚗' },
    { id: 'motorcycles', label: 'Motos', icon: '🏍️' },
    { id: 'trucks', label: 'Caminhões', icon: '🚛' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex flex-col items-center justify-center p-3 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all ${
            selected === opt.id
              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-[1.02]'
              : 'border-slate-100 bg-white hover:border-blue-100 text-slate-400'
          }`}
        >
          <span className="text-2xl md:text-4xl mb-1 md:mb-2">{opt.icon}</span>
          <span className="text-[10px] md:text-xs font-black uppercase italic tracking-tighter">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

export default VehicleTypeSelector;

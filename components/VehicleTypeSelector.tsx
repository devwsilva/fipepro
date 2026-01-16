
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
    <div className="grid grid-cols-3 gap-3 mb-6">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            selected === opt.id
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white hover:border-blue-200'
          }`}
        >
          <span className="text-3xl mb-2">{opt.icon}</span>
          <span className="text-sm font-semibold">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

export default VehicleTypeSelector;

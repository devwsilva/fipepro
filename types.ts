
export type VehicleType = 'cars' | 'motorcycles' | 'trucks';

export interface FipeItem {
  code: string;
  name: string;
}

export interface FipeReference {
  code: number;
  month: string;
}

export interface FipeResult {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
  vehicleType: number;
  fuelAcronym: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: FipeResult;
}

export interface Favorite {
  fipeCode: string;
  yearId: string;
  vehicleType: VehicleType;
  brandName: string;
  modelName: string;
  savedPrice: string;
  savedReference: string;
  currentPrice?: string;
  priceAlert?: boolean;
}

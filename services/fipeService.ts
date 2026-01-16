
import { FipeItem, FipeResult, VehicleType, FipeReference } from '../types';

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';

export const fipeService = {
  getBrands: async (type: VehicleType): Promise<FipeItem[]> => {
    const res = await fetch(`${BASE_URL}/${type}/brands`);
    if (!res.ok) throw new Error('Erro marcas');
    return res.json();
  },

  getModels: async (type: VehicleType, brandId: string): Promise<FipeItem[]> => {
    const res = await fetch(`${BASE_URL}/${type}/brands/${brandId}/models`);
    if (!res.ok) throw new Error('Erro modelos');
    return res.json();
  },

  getYears: async (type: VehicleType, brandId: string, modelId: string): Promise<FipeItem[]> => {
    const res = await fetch(`${BASE_URL}/${type}/brands/${brandId}/models/${modelId}/years`);
    if (!res.ok) throw new Error('Erro anos');
    return res.json();
  },

  getDetails: async (type: VehicleType, brandId: string, modelId: string, yearId: string): Promise<FipeResult> => {
    const res = await fetch(`${BASE_URL}/${type}/brands/${brandId}/models/${modelId}/years/${yearId}`);
    if (!res.ok) throw new Error('Erro detalhes');
    return res.json();
  },

  getDetailsByFipe: async (type: VehicleType, fipeCode: string, yearId: string, refId?: number): Promise<FipeResult> => {
    const url = refId 
      ? `${BASE_URL}/${type}/models/${fipeCode}/years/${yearId}?reference=${refId}`
      : `${BASE_URL}/${type}/models/${fipeCode}/years/${yearId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro Fipe Lookup');
    return res.json();
  },

  getReferences: async (): Promise<FipeReference[]> => {
    const res = await fetch(`${BASE_URL}/references`);
    if (!res.ok) throw new Error('Erro refs');
    return res.json();
  }
};

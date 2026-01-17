
import { FipeItem, FipeResult, VehicleType, FipeReference } from '../types';

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';

export const fipeService = {
  getBrands: async (type: VehicleType): Promise<FipeItem[]> => {
    const res = await fetch(`${BASE_URL}/${type}/brands`);
    if (!res.ok) throw new Error('Erro ao buscar marcas');
    return res.json();
  },

  // Busca todos os anos disponíveis para uma marca específica
  getYearsByBrand: async (type: VehicleType, brandId: string): Promise<FipeItem[]> => {
    const res = await fetch(`${BASE_URL}/${type}/brands/${brandId}/years`);
    if (!res.ok) throw new Error('Erro ao buscar anos da marca');
    return res.json();
  },

  // Busca todos os modelos de uma marca em um ano específico
  getModelsByYear: async (type: VehicleType, brandId: string, yearId: string): Promise<FipeItem[]> => {
    const res = await fetch(`${BASE_URL}/${type}/brands/${brandId}/years/${yearId}/models`);
    if (!res.ok) throw new Error('Erro ao buscar modelos do ano');
    return res.json();
  },

  // Mantido para compatibilidade e busca final de detalhes
  getDetails: async (type: VehicleType, brandId: string, modelId: string, yearId: string): Promise<FipeResult> => {
    const res = await fetch(`${BASE_URL}/${type}/brands/${brandId}/models/${modelId}/years/${yearId}`);
    if (!res.ok) throw new Error('Erro ao buscar detalhes do veículo');
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
    if (!res.ok) throw new Error('Erro ao buscar referências');
    return res.json();
  }
};

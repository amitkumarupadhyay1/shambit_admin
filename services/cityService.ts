import api from '@/lib/api';

export interface City {
  id: number;
  name: string;
  slug: string;
  state: string;
}

export const cityService = {
  getCities: async (): Promise<City[]> => {
    const response = await api.get<City[] | { results: City[] }>('/cities/');
    return Array.isArray(response.data) ? response.data : response.data.results;
  },
};

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const mpTicket = process.env.MERCADO_PUBLICO_TICKET || '';

if (!mpTicket) {
  throw new Error('MERCADO_PUBLICO_TICKET is missing in environment variables.');
}

const mpClient = axios.create({
  baseURL: 'https://api.mercadopublico.cl/servicios/v1/publico',
  timeout: 30000, // 30 segundos
});

// Interceptor para inyectar automáticamente el ticket en todas las peticiones
mpClient.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    ticket: mpTicket
  };
  return config;
});

export const mercadoPublicoAPI = {
  /**
   * Obtiene la lista base de licitaciones publicadas en una fecha particular
   * @param fecha Formato DDMMAAAA (ej: '02022014')
   */
  async getLicitacionesPorFecha(fecha: string) {
    try {
      const response = await mpClient.get('/licitaciones.json', {
        params: { fecha }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching MP licitaciones by date ${fecha}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene licitaciones activas actualmente (Estado = Publicada).
   * Equivalente a "todo lo que aun está abierto para postular".
   */
  async getLicitacionesActivas() {
    try {
      const response = await mpClient.get('/licitaciones.json', {
        params: { estado: 'publicada' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching MP licitaciones activas:', error);
      throw error;
    }
  },

  /**
   * Obtiene el detalle completo de una licitación en particular (incluyendo montos, ítems, organismo, etc.)
   * @param codigoExterno Código de la licitación (ej: '1509-5-L114')
   */
  async getLicitacionDetalle(codigoExterno: string) {
    try {
      const response = await mpClient.get('/licitaciones.json', {
        params: { codigo: codigoExterno }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching MP detalle for codigo ${codigoExterno}:`, error);
      throw error;
    }
  }
};

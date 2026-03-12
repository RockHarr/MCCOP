// Tipos base para mapear la base de datos y la API de Mercado Público

// Definimos la estructura cruda que esperamos de la API detallada (simplificada de los campos clave)
export interface MPLicitacionDetail {
  CodigoExterno: string;
  Nombre: string;
  CodigoEstado: number;
  Estado?: string;
  Descripcion?: string;
  FechaCierre?: string;
  Tipo?: string;
  MontoEstimado?: number;
  Moneda?: string;
  Comprador?: {
    NombreOrganismo?: string;
    UnidadCompra?: string;
  };
}

export interface MPResponse {
  Cantidad: number;
  FechaCreacion: string;
  Version: string;
  Listado: MPLicitacionDetail[];
}

// Interfaz para la entidad normalizada de la base de datos
export interface Opportunity {
  external_code: string;
  title: string;
  description: string | null;
  raw_status: string | null;
  type: string | null;
  closed_at: string | null; // ISO Date String
  estimated_amount: number | null;
  currency: string | null;
  org_name: string | null;
  buyer_unit: string | null;
  raw_json: any; // El json íntegro de la API
}

export interface DatabaseResult {
  started_at: string;
  completed_at?: string;
  new_records_count: number;
  updated_records_count: number;
  status: 'running' | 'success' | 'error';
  error_log?: string;
}

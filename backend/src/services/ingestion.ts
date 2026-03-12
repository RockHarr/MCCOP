import { supabase } from '../lib/supabase';
import { mercadoPublicoAPI } from '../lib/mercadoPublico';
import { Opportunity, MPLicitacionDetail } from '../types';

export class IngestionService {
  /**
   * Ejecuta el proceso de ingesta para una fecha dada (DDMMAAAA)
   */
  static async runForDate(fecha: string, limit?: number) {
    console.log(`[Ingestion] Iniciando corrida para fecha: ${fecha}`);
    
    // 1. Registrar corrida en la base de datos
    const { data: runData, error: runError } = await supabase
      .from('ingestion_runs')
      .insert({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (runError || !runData) {
      console.error('[Ingestion] Error creando registro de corrida:', runError);
      throw new Error('No se pudo iniciar la corrida de ingesta');
    }

    const runId = runData.id;
    let newCount = 0;
    let updatedCount = 0;

    try {
      // 2. Obtener listado de Mercado Público
      const response = await mercadoPublicoAPI.getLicitacionesPorFecha(fecha);
      const listado = response.Listado || [];
      console.log(`[Ingestion] Se encontraron ${listado.length} licitaciones en el listado base para ${fecha}.`);

      const itemsToProcess = limit ? listado.slice(0, limit) : listado;
      console.log(`[Ingestion] Procesando ${itemsToProcess.length} licitaciones (Límite aplicado: ${limit || 'Ninguno'})`);

      // 3. Procesar cada licitación
      for (const item of itemsToProcess) {
        try {
          // Obtenemos el detalle completo para cada oportunidad (Necesario para rubro, organismo y montos)
          const detalleResponse = await mercadoPublicoAPI.getLicitacionDetalle(item.CodigoExterno);
          
          if (!detalleResponse.Listado || detalleResponse.Listado.length === 0) {
            console.warn(`[Ingestion] No se encontró detalle para ${item.CodigoExterno}`);
            continue;
          }

          const detalleCrudo: MPLicitacionDetail = detalleResponse.Listado[0];
          
          // Mapeamos a nuestro modelo interno
          const opportunity: Opportunity = {
            external_code: detalleCrudo.CodigoExterno,
            title: detalleCrudo.Nombre,
            description: detalleCrudo.Descripcion || null,
            raw_status: detalleCrudo.Estado || item.CodigoEstado?.toString() || null,
            type: detalleCrudo.Tipo || null,
            closed_at: detalleCrudo.FechaCierre ? new Date(detalleCrudo.FechaCierre).toISOString() : null,
            estimated_amount: detalleCrudo.MontoEstimado || null,
            currency: detalleCrudo.Moneda || null,
            org_name: detalleCrudo.Comprador?.NombreOrganismo || null,
            buyer_unit: detalleCrudo.Comprador?.UnidadCompra || null,
            raw_json: detalleCrudo
          };

          // 4. Guardar en Supabase (Upsert evasivo de duplicados)
          const { data: existing } = await supabase
            .from('opportunities')
            .select('id')
            .eq('external_code', opportunity.external_code)
            .single();

          if (existing) {
            // Update
            const { error: updateError } = await supabase
              .from('opportunities')
              .update({
                ...opportunity,
                updated_at: new Date().toISOString()
              })
              .eq('external_code', opportunity.external_code);
            
            if (updateError) {
              console.error(`[Ingestion] Error actualizando ${opportunity.external_code}`, updateError);
            } else {
              updatedCount++;
            }
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('opportunities')
              .insert(opportunity);

            if (insertError) {
               console.error(`[Ingestion] Error insertando ${opportunity.external_code}`, insertError);
            } else {
               newCount++;
            }
          }

          // Delay más conservador para respetar el rate limit de la API (1 petición simultánea por ticket)
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (itemError) {
          console.error(`[Ingestion] Error procesando item ${item.CodigoExterno}:`, itemError);
        }
      }

      // 5. Finalizar corrida con éxito
      await supabase
        .from('ingestion_runs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          new_records_count: newCount,
          updated_records_count: updatedCount
        })
        .eq('id', runId);

      console.log(`[Ingestion] Corrida exitosa. Nuevas: ${newCount}, Actualizadas: ${updatedCount}.`);

    } catch (generalError: any) {
      // 6. Registrar falla fatal en la corrida
      console.error('[Ingestion] Falla fatal en la corrida:', generalError);
      await supabase
        .from('ingestion_runs')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          error_log: generalError.message || JSON.stringify(generalError)
        })
        .eq('id', runId);
    }
  }
}

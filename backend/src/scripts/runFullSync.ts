import { IngestionService } from '../services/ingestion';
import { mercadoPublicoAPI } from '../lib/mercadoPublico';
import { supabase } from '../lib/supabase';

/**
 * Script de Sincronización Completa.
 * Trae TODAS las licitaciones actualmente publicadas (estado = "Publicada")
 * en Mercado Público, sin importar su fecha de publicación.
 * 
 * Usar:
 *  - Primera vez que usas el sistema
 *  - Cuando quieras asegurarte de tener todo el catálogo vigente
 * 
 * Para uso diario, es mejor usar runIngestion.js (solo las nuevas del día)
 */

async function main() {
  console.log('[Script] Iniciando sincronización completa (estado=Publicada)...');
  
  try {
    // 1. Obtener listado de todas las licitaciones activas
    console.log('[Script] Consultando API: ¿qué licitaciones están activas hoy?');
    const response = await mercadoPublicoAPI.getLicitacionesActivas();
    const listado = response?.Listado || [];
    
    console.log(`[Script] La API reporta ${listado.length} licitaciones activas en total.`);
    
    if (listado.length === 0) {
      console.log('[Script] No hay licitaciones activas. Revisa el estado de la API.');
      process.exit(0);
    }

    // 2. Procesar en lotes para no saturar la API (lotes de 10, con pausa entre lotes)
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 5000; // 5 segundos entre lotes
    let totalNuevas = 0;
    let totalActualizadas = 0;

    for (let i = 0; i < listado.length; i += BATCH_SIZE) {
      const lote = listado.slice(i, i + BATCH_SIZE);
      const loteNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalLotes = Math.ceil(listado.length / BATCH_SIZE);
      
      console.log(`\n[Script] Procesando lote ${loteNum}/${totalLotes} (${lote.length} licitaciones)...`);

      for (const item of lote) {
        try {
          // Obtener detalle completo
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s entre cada llamada de detalle
          const detalleResponse = await mercadoPublicoAPI.getLicitacionDetalle(item.CodigoExterno);
          const detalle = detalleResponse?.Listado?.[0];
          
          if (!detalle) continue;

          // Normalizar y guardar
          const opportunity = {
            external_code: detalle.CodigoExterno,
            title: detalle.Nombre || 'Sin título',
            description: detalle.Descripcion || null,
            raw_status: detalle.Estado || null,
            type: detalle.Tipo || null,
            closed_at: detalle.FechaCierre ? new Date(detalle.FechaCierre).toISOString() : null,
            estimated_amount: detalle.MontoEstimado || null,
            currency: detalle.Moneda || 'CLP',
            org_name: detalle.Comprador?.NombreOrganismo || null,
            buyer_unit: detalle.Comprador?.UnidadCompra || null,
            raw_json: detalle,
          };

          const { error, data } = await supabase
            .from('opportunities')
            .upsert(opportunity, { onConflict: 'external_code' })
            .select('id')
            .single();

          if (!error) {
            console.log(`  ✓ ${detalle.CodigoExterno} — ${(detalle.Nombre || '').substring(0, 50)}`);
            totalNuevas++;
          }

        } catch (err: any) {
          if (err?.response?.data?.Codigo === 10500) {
            console.log(`  [Rate limit] Esperando 5s antes de continuar...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            console.error(`  ✗ Error en ${item.CodigoExterno}:`, err?.message || err);
          }
        }
      }

      // Pausa entre lotes
      if (i + BATCH_SIZE < listado.length) {
        console.log(`[Script] Pausa entre lotes (${BATCH_DELAY_MS / 1000}s)...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    console.log(`\n[Script] ✅ Sincronización completa finalizada.`);
    console.log(`[Script] Procesadas: ${totalNuevas} licitaciones guardadas/actualizadas.`);
    console.log(`[Script] Puedes correr ahora: node dist/scripts/runScoring.js`);

  } catch (error) {
    console.error('[Script] Error fatal:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

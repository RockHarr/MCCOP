import { mercadoPublicoAPI } from '../lib/mercadoPublico';
import { supabase } from '../lib/supabase';

/**
 * Sincronización Inteligente
 *
 * Obtiene licitaciones activas (publicadas) y filtra por keywords relacionadas con TI
 * ANTES de descargar el detalle completo, ahorrando tiempo y respetando rate limits.
 */

// Keywords relacionadas con informática, web, software, etc.
const TI_KEYWORDS = [
  'software', 'informatic', 'informatica', 'sistema', 'tecnolog',
  'web', 'digital', 'aplicacion', 'aplicación', 'plataforma',
  'desarrollo', 'programacion', 'programación', 'base de datos',
  'servidores', 'computador', 'computacion', 'computación',
  'internet', 'cloud', 'nube', 'ciberseguridad', 'seguridad informatica',
  'redes', 'ti ', 'tic', 'assessment', 'consultoria ti', 'consultoría ti',
  'implementacion', 'implementación', 'integracion', 'integración',
  'licencias', 'microsoft', 'oracle', 'sap', 'erp', 'crm'
];

async function matchesKeywords(title: string, description?: string): Promise<boolean> {
  const text = `${title} ${description || ''}`.toLowerCase();
  return TI_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

async function main() {
  console.log('[SmartSync] Iniciando sincronización inteligente...');
  console.log(`[SmartSync] Buscando licitaciones activas relacionadas con: ${TI_KEYWORDS.slice(0, 10).join(', ')}...\n`);

  try {
    // 1. Obtener listado de licitaciones activas (estado=Publicada)
    const response = await mercadoPublicoAPI.getLicitacionesActivas();
    const listado = response?.Listado || [];

    console.log(`[SmartSync] Se encontraron ${listado.length} licitaciones activas en total.`);

    if (listado.length === 0) {
      console.log('[SmartSync] No hay licitaciones activas. Saliendo.');
      process.exit(0);
    }

    // 2. Filtrar por keywords en el título ANTES de pedir detalles
    console.log('[SmartSync] Filtrando por keywords de TI...');
    const filtered = listado.filter((item: any) => {
      const title = item.Nombre || '';
      const desc = item.Descripcion || '';
      return matchesKeywords(title, desc);
    });

    console.log(`[SmartSync] Encontradas ${filtered.length} licitaciones relacionadas con TI.`);

    if (filtered.length === 0) {
      console.log('[SmartSync] No se encontraron licitaciones de TI activas. Intenta más tarde.');
      process.exit(0);
    }

    // 3. Limitar a las primeras 50 para tener más datos
    const LIMIT = 50;
    const toProcess = filtered.slice(0, LIMIT);
    console.log(`[SmartSync] Procesando las primeras ${toProcess.length} licitaciones...\n`);

    let insertCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    // 4. Procesar cada una obteniendo el detalle
    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i];
      const progress = `[${i + 1}/${toProcess.length}]`;

      try {
        console.log(`${progress} Procesando: ${item.CodigoExterno} - ${item.Nombre?.substring(0, 60)}...`);

        // Esperar 2 segundos entre llamadas para respetar rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

        const detalleResponse = await mercadoPublicoAPI.getLicitacionDetalle(item.CodigoExterno);
        const detalle = detalleResponse?.Listado?.[0];

        if (!detalle) {
          console.log(`${progress}   ⚠️  No se encontró detalle`);
          continue;
        }

        // Normalizar a nuestro modelo
        const opportunity = {
          external_code: detalle.CodigoExterno,
          title: detalle.Nombre || item.Nombre || 'Sin título',
          description: detalle.Descripcion || item.Descripcion || null,
          raw_status: detalle.Estado || 'Publicada',
          type: detalle.Tipo || null,
          closed_at: detalle.FechaCierre ? new Date(detalle.FechaCierre).toISOString() : null,
          estimated_amount: detalle.MontoEstimado || null,
          currency: detalle.Moneda || 'CLP',
          org_name: detalle.Comprador?.NombreOrganismo || null,
          buyer_unit: detalle.Comprador?.UnidadCompra || null,
          raw_json: detalle,
        };

        // Upsert en la base de datos
        const { data: existing } = await supabase
          .from('opportunities')
          .select('id')
          .eq('external_code', opportunity.external_code)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('opportunities')
            .update({ ...opportunity, updated_at: new Date().toISOString() })
            .eq('external_code', opportunity.external_code);

          if (error) {
            console.log(`${progress}   ❌ Error actualizando: ${error.message}`);
            errorCount++;
          } else {
            console.log(`${progress}   ✓ Actualizada`);
            updateCount++;
          }
        } else {
          const { error } = await supabase
            .from('opportunities')
            .insert(opportunity);

          if (error) {
            console.log(`${progress}   ❌ Error insertando: ${error.message}`);
            errorCount++;
          } else {
            console.log(`${progress}   ✓ Nueva licitación guardada`);
            insertCount++;
          }
        }

      } catch (err: any) {
        console.log(`${progress}   ❌ Error: ${err?.message || 'Error desconocido'}`);
        errorCount++;

        // Si es rate limit, esperar más tiempo
        if (err?.response?.status === 429 || err?.response?.data?.Codigo === 10500) {
          console.log(`${progress}   ⏳ Rate limit detectado, esperando 10 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }

    // 5. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('[SmartSync] ✅ Sincronización completada');
    console.log(`[SmartSync] Nuevas: ${insertCount} | Actualizadas: ${updateCount} | Errores: ${errorCount}`);
    console.log('[SmartSync] Siguiente paso: ejecuta npm run script:scoring para puntuar las oportunidades');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('[SmartSync] ❌ Error fatal:', error?.message || error);
    process.exit(1);
  }

  process.exit(0);
}

main();

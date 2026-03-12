import { supabase } from '../lib/supabase';

interface Keyword {
  id: string;
  type: 'positive' | 'negative';
  word: string;
  weight: number;
}

interface Profile {
  id: string;
  name: string;
  min_amount: number;
  max_amount: number;
}

interface OpportunityDB {
  id: string;
  title: string;
  description: string;
  estimated_amount: number;
}

export class ScoringService {
  /**
   * Frases contextuales que indican que NO es del rubro TI/software
   * aunque contengan palabras como "desarrollo", "sistema", etc.
   */
  private static readonly CONTEXTUAL_EXCLUSIONS = [
    'desarrollo comunitario',
    'desarrollo social',
    'desarrollo humano',
    'desarrollo infantil',
    'desarrollo local',
    'sistema de riego',
    'sistema de agua',
    'sistema eléctrico',
    'sistema sanitario',
    'aplicación de pintura',
    'aplicación de vacunas',
    'medicamentos',
    'fármacos',
    'insumos médicos',
    'equipamiento médico',
    'construcción',
    'obra civil',
    'infraestructura vial',
    'maquinaria pesada',
    'aseo',
    'limpieza',
    'mantención de edificios',
    'alimentos',
    'alimentación'
  ];

  /**
   * Evalúa las oportunidades recientes contra un perfil de negocio específico.
   * Crea registros en `opportunity_matches`.
   */
  static async evaluateProfile(profileId: string, limit: number = 100) {
    console.log(`[Scoring] Iniciando evaluación para el perfil: ${profileId}`);

    // 1. Obtener datos del perfil
    const { data: profile, error: errProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (errProfile || !profile) {
      throw new Error(`No se pudo obtener el perfil ${profileId}`);
    }

    // 2. Obtener palabras clave del perfil
    const { data: keywords, error: errKws } = await supabase
      .from('keywords')
      .select('*')
      .eq('profile_id', profileId);

    if (errKws) {
      throw new Error(`No se pudieron obtener las keywords del perfil ${profileId}`);
    }

    const posKeywords = (keywords || []).filter(k => k.type === 'positive');
    const negKeywords = (keywords || []).filter(k => k.type === 'negative');

    // 3. Obtener oportunidades que AÚN NO han sido evaluadas para este perfil
    // Utilizamos una subquery o un left join. Para V1, traemos las últimas ingresadas
    // y luego filtramos/evadimos el Unique Constraint al insertar, o hacemos el inner join.
    // Usaremos un enfoque simple: traer las últimas 'limit' oportunidades.
    const { data: opportunities, error: errOpp } = await supabase
      .from('opportunities')
      .select('id, title, description, estimated_amount')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (errOpp || !opportunities) {
      throw new Error(`Error obteniendo oportunidades: ${errOpp?.message}`);
    }

    console.log(`[Scoring] Evaluando ${opportunities.length} oportunidades...`);
    
    let matchesCreated = 0;

    // 4. Calcular el Score para cada oportunidad
    for (const opp of opportunities) {
      const textToSearch = `${opp.title || ''} ${opp.description || ''}`.toLowerCase();
      let score = 0;
      let isDismissed = false;
      let matchedWords: string[] = [];

      // A) Filtro por exclusiones contextuales (PRIORIDAD MÁXIMA)
      // Descarta automáticamente si contiene frases que indican que NO es del rubro TI
      for (const exclusion of ScoringService.CONTEXTUAL_EXCLUSIONS) {
        if (textToSearch.includes(exclusion.toLowerCase())) {
          isDismissed = true;
          matchedWords.push(`-CONTEXTO:${exclusion}`);
          break;
        }
      }

      // B) Filtro por monto (si el perfil lo define y la oportunidad lo tiene)
      if (!isDismissed && opp.estimated_amount != null) {
        if (profile.min_amount != null && opp.estimated_amount < profile.min_amount) {
          isDismissed = true;
          matchedWords.push('RECHAZO_POR_MONTO_MINIMO');
        }
        if (profile.max_amount != null && opp.estimated_amount > profile.max_amount) {
          isDismissed = true;
          matchedWords.push('RECHAZO_POR_MONTO_MAXIMO');
        }
      }

      // C) Filtro por palabras negativas del usuario (Hard dismiss)
      if (!isDismissed) {
        for (const neg of negKeywords) {
          // Mejorado: buscar palabra completa, no subcadena
          const wordRegex = new RegExp(`\\b${neg.word.toLowerCase()}\\b`, 'i');
          if (wordRegex.test(textToSearch)) {
            isDismissed = true;
            matchedWords.push(`-${neg.word}`);
            break; // Una sola palabra negativa la descarta
          }
        }
      }

      // D) Puntuación por palabras positivas (si no está descartada)
      if (!isDismissed) {
        for (const pos of posKeywords) {
          // Mejorado: buscar palabra completa, no subcadena
          const wordRegex = new RegExp(`\\b${pos.word.toLowerCase()}\\b`, 'i');
          if (wordRegex.test(textToSearch)) {
            score += pos.weight || 1;
            matchedWords.push(`+${pos.word}`);
          }
        }
      }

      // 5. Guardar el Match (upsert para evadir conflictos si ya existía)
      const { error: upsertErr } = await supabase
        .from('opportunity_matches')
        .upsert(
          {
            opportunity_id: opp.id,
            profile_id: profile.id,
            score: score,
            matched_keywords: matchedWords,
            is_dismissed_by_engine: isDismissed
          },
          { onConflict: 'opportunity_id, profile_id' }
        );

      if (upsertErr) {
        console.error(`[Scoring] Error guardando match para oportunidad ${opp.id}:`, upsertErr);
      } else {
        matchesCreated++;
      }
    }

    console.log(`[Scoring] Proceso completado. ${matchesCreated} matches actualizados o creados.`);
  }
}

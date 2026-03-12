import { supabase } from '../lib/supabase';
import { ScoringService } from '../services/scoring';

async function main() {
  console.log('[Script] Creando/Buscando un perfil de negocio de prueba...');

  // 1. Obtener el primer usuario de Supabase Auth (simulando que es el dueño)
  // Nota: Al usar Service Role, podemos listar los usuarios directamente.
  const { data: users, error: errUsr } = await supabase.auth.admin.listUsers();
  
  if (errUsr || !users || users.users.length === 0) {
    console.error('No se encontraron usuarios en Auth. Por favor crea un usuario en tu Dashboard de Supabase (Authentication -> Add user).');
    process.exit(1);
  }

  const testUserId = users.users[0].id;
  
  // 2. Crear un Perfil "en duro" si no existe
  let { data: profile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('name', 'Perfil Consultoría de Software')
    .single();

  if (!profile) {
    console.log('[Script] Entorno sin perfil. Creando Perfil: Consultoría de Software');
    const { data: newProfile, error: errProf } = await supabase
      .from('business_profiles')
      .insert({
        user_id: testUserId,
        name: 'Perfil Consultoría de Software',
        min_amount: 5000000 // 5 millones CLP base
      })
      .select('*')
      .single();

    if (errProf) {
       console.error('Error insertando perfil de prueba:', errProf);
       process.exit(1);
    }
    profile = newProfile;

    // 3. Crear algunas keywords de prueba para ese perfil
    console.log('[Script] Creando keywords de prueba...');
    await supabase.from('keywords').insert([
      { profile_id: profile!.id, type: 'positive', word: 'software', weight: 10 },
      { profile_id: profile!.id, type: 'positive', word: 'desarrollo', weight: 8 },
      { profile_id: profile!.id, type: 'positive', word: 'aplicación', weight: 5 },
      { profile_id: profile!.id, type: 'positive', word: 'plataforma', weight: 5 },
      { profile_id: profile!.id, type: 'negative', word: 'construcción', weight: 1 }, // Ruido
      { profile_id: profile!.id, type: 'negative', word: 'aseo', weight: 1 }          // Ruido
    ]);
  }

  // 4. Correr motor de Scoring
  if (profile) {
    console.log('[Script] Ejecutando motor de reglas...');
    await ScoringService.evaluateProfile(profile.id, 50);
  }

  console.log(`[Script] Proceso finalizado. Oportunidades guardadas y puntuadas.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[Script] Error no manejado:', err);
  process.exit(1);
});

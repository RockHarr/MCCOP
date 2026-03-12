import { IngestionService } from '../services/ingestion';

async function main() {
  // Obtenemos la fecha de hoy en formato DDMMAAAA
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const fechaStr = `${day}${month}${year}`;

  console.log(`[Script] Iniciando ingesta de prueba para ${fechaStr}`);
  
  // Imponemos un límite de 5 para probar el flujo completo sin quemar la API ni demorar mucho
  await IngestionService.runForDate(fechaStr, 5);
  
  console.log(`[Script] Proceso finalizado.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[Script] Error no manejado:', err);
  process.exit(1);
});

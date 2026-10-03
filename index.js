// index.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Conexión a tu base de datos
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🤖 El robot está encendido y esperando...");

// Esto es una expresión Cron. '* * * * *' significa: "Ejecutar CADA MINUTO"
// En la vida real lo pondríamos una vez al día, pero para probarlo usamos cada minuto.
cron.schedule('* * * * *', async () => {
    console.log("⏰ Revisando tareas vencidas...");

    // 1. Obtener la fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];

    // 2. Buscar tareas que vencieron antes de hoy, que no estén completadas 
    // y que no tengan ya la etiqueta de [¡VENCIDA!]
    const { data: tareasVencidas, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('completada', false)
        .lt('fecha_limite', hoy)
        .not('titulo', 'like', '%[¡VENCIDA!]%'); // Para no duplicar la etiqueta

    if (error) {
        console.error("❌ Error al buscar tareas:", error);
        return;
    }

    if (tareasVencidas.length === 0) {
        console.log("✅ No hay tareas nuevas por marcar como vencidas.");
        return;
    }

    console.log(`🚨 Se encontraron ${tareasVencidas.length} tareas vencidas. Actualizando...`);

    // 3. Actualizar cada tarea
    for (const tarea of tareasVencidas) {
        const nuevoTitulo = `[¡VENCIDA!] ${tarea.titulo}`;
        
        await supabase
            .from('tareas')
            .update({ titulo: nuevoTitulo })
            .eq('id', tarea.id);
            
        console.log(`-> Actualizada: ${nuevoTitulo}`);
    }
});
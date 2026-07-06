const cron = require('node-cron');
const { ejecutarAscensosPendientes } = require('./ejecutarAscensosPendientes');
const { ejecutarCambiosModalidad } = require('./ejecutarCambiosModalidad');

console.log('🔄 Inicializando todos los jobs programados...');

// 0 0,12 * * *  → A las 00:00 y 12:00 todos los días
cron.schedule('0 0,12 * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Ejecutando ascensos pendientes...`);
    try {
        await ejecutarAscensosPendientes();
        console.log(`✅ Ascensos pendientes ejecutados correctamente`);
    } catch (error) {
        console.error(`❌ Error en ascensos pendientes:`, error.message);
    }
});

// Job 2: Cambios de modalidad - 12:00 AM y 12:00 PM (medianoche y mediodía)
cron.schedule('0 0,12 * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Ejecutando cambios de modalidad...`);
    try {
        await ejecutarCambiosModalidad();
        console.log(`✅ Cambios de modalidad ejecutados correctamente`);
    } catch (error) {
        console.error(`❌ Error en cambios de modalidad:`, error.message);
    }
});

console.log('✅ Todos los jobs han sido programados');

module.exports = {
    ejecutarAscensosPendientes,
    ejecutarCambiosModalidad
};
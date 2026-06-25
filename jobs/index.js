const ejecutarAscensosPendientes = require('./ejecutarAscensosPendientes');
const ejecutarCambiosModalidad = require('./ejecutarCambiosModalidad');



console.log('🔄 Inicializando todos los jobs programados...');

// Exportar todos los jobs por si necesitas ejecutarlos manualmente
module.exports = {
    ejecutarAscensosPendientes,
    ejecutarCambiosModalidad
};
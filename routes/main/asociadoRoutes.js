const express = require('express');
const router = express.Router();
const asociadoController = require('../../controllers/main/asociadoController');

// ✅ Rutas estáticas SIEMPRE antes de las paramétricas
router.get('/antiguedad', asociadoController.getAntiguedadMinima);
router.get('/cedula/:cedula', asociadoController.getAsociadoByCedula);
router.get('/resumen-antiguedad', asociadoController.getResumenAntiguedad);
router.get('/diagnostico', asociadoController.diagnostico);
router.get('/test-fechas', asociadoController.testFechas);
router.get('/exportar-excel', asociadoController.exportToExcel);
router.get('/:identificacion', asociadoController.getAsociadoById);

module.exports = router;
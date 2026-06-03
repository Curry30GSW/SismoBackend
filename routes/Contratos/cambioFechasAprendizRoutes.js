const express = require('express');
const router = express.Router();
const cambioFechasAprendizController = require('../../controllers/Contratos/CambioFechasAprendizController');

// PUT /api/contratos/:id/cambiar-fechas-aprendiz - Cambiar fechas de aprendiz
router.put('/:id/cambiar-fechas-aprendiz', cambioFechasAprendizController.cambiarFechas);

// GET /api/contratos/:id/historial-fechas-aprendiz - Obtener historial de cambios
router.get('/:id/historial-fechas-aprendiz', cambioFechasAprendizController.getHistorial);

module.exports = router;
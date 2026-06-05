const express = require('express');
const router = express.Router();
const cambioFechasAprendizController = require('../../controllers/Contratos/CambioFechasAprendizController');
const { authMiddleware } = require('../../middlewares/authMiddleware');


// PUT /api/contratos/:id/cambiar-fechas-aprendiz - Cambiar fechas de aprendiz
router.put('/:id/cambiar-fechas-aprendiz', authMiddleware, cambioFechasAprendizController.cambiarFechas);

// GET /api/contratos/:id/historial-fechas-aprendiz - Obtener historial de cambios
router.get('/:id/historial-fechas-aprendiz', authMiddleware, cambioFechasAprendizController.getHistorial);

module.exports = router;
const express = require('express');
const router = express.Router();
const movimientoCargoController = require('../../controllers/plantaCargos/movimientoCargoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// RUTAS DE MOVIMIENTOS DE CARGO
// Ruta base: /movimientos-cargo
// =============================================

// Rutas de consulta general
router.get('/anio/:id_anio_legal', authMiddleware, movimientoCargoController.getByAnio);
router.get('/anio/:id_anio_legal/resumen', authMiddleware, movimientoCargoController.getResumenByAnio);
router.get('/anio/:id_anio_legal/estadisticas', authMiddleware, movimientoCargoController.getEstadisticasGlobales);
router.get('/tipo/:tipo', authMiddleware, movimientoCargoController.getByTipo);

// Rutas de historial por entidad
router.get('/posicion/:id_posicion', authMiddleware, movimientoCargoController.getByPosicion);
router.get('/posicion/:id_posicion/historial', authMiddleware, movimientoCargoController.getHistorialPosicion);
router.get('/funcionario/:id_funcionario', authMiddleware, movimientoCargoController.getByFuncionario);
router.get('/funcionario/:id_funcionario/historial', authMiddleware, movimientoCargoController.getHistorialFuncionario);

// Rutas para registrar movimientos (helpers)
router.post('/creacion', authMiddleware, movimientoCargoController.registrarCreacion);
router.post('/asignacion', authMiddleware, movimientoCargoController.registrarAsignacion);
router.post('/desasignacion', authMiddleware, movimientoCargoController.registrarDesasignacion);
router.post('/traslado', authMiddleware, movimientoCargoController.registrarTraslado);
router.post('/eliminacion', authMiddleware, movimientoCargoController.registrarEliminacion);


module.exports = router;
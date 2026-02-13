const express = require('express');
const router = express.Router();
const movimientoCargoController = require('../controllers/movimientoCargoController');

// =============================================
// RUTAS DE MOVIMIENTOS DE CARGO
// Ruta base: /movimientos-cargo
// =============================================

// Rutas de consulta general
router.get('/anio/:id_anio_legal', movimientoCargoController.getByAnio);
router.get('/anio/:id_anio_legal/resumen', movimientoCargoController.getResumenByAnio);
router.get('/anio/:id_anio_legal/estadisticas', movimientoCargoController.getEstadisticasGlobales);
router.get('/tipo/:tipo', movimientoCargoController.getByTipo);

// Rutas de historial por entidad
router.get('/posicion/:id_posicion', movimientoCargoController.getByPosicion);
router.get('/posicion/:id_posicion/historial', movimientoCargoController.getHistorialPosicion);
router.get('/funcionario/:id_funcionario', movimientoCargoController.getByFuncionario);
router.get('/funcionario/:id_funcionario/historial', movimientoCargoController.getHistorialFuncionario);

// Rutas para registrar movimientos (helpers)
router.post('/creacion', movimientoCargoController.registrarCreacion);
router.post('/asignacion', movimientoCargoController.registrarAsignacion);
router.post('/desasignacion', movimientoCargoController.registrarDesasignacion);
router.post('/traslado', movimientoCargoController.registrarTraslado);
router.post('/eliminacion', movimientoCargoController.registrarEliminacion);

// Ruta genérica para crear movimiento (uso interno, solo si es necesario)
// router.post('/', movimientoCargoController.create);

module.exports = router;
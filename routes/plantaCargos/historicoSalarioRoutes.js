const express = require('express');
const router = express.Router();
const historicoSalarioController = require('../../controllers/plantaCargos/HistoricoSalarioController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// RUTAS DE HISTÓRICO DE SALARIOS
// Ruta base: /historico-salarios
// =============================================

// Rutas de consulta general
router.get('/anio/:id_anio_legal', authMiddleware, historicoSalarioController.getByAnio);
router.get('/cargo/:id_cargo_base', authMiddleware, historicoSalarioController.getHistorialByCargo);
router.get('/cargo/:id_cargo_base/comparativo', authMiddleware, historicoSalarioController.getComparativo);
router.get('/cargo/:id_cargo_base/anio/:id_anio_legal', authMiddleware, historicoSalarioController.getByCargoAndAnio);

// Rutas de operaciones
router.post('/', authMiddleware, historicoSalarioController.upsert);
router.post('/lote', authMiddleware, historicoSalarioController.configurarLote);
router.put('/:id', authMiddleware, historicoSalarioController.update);
router.patch('/:id/activo', authMiddleware, historicoSalarioController.setActivo);
router.delete('/:id', authMiddleware, historicoSalarioController.deactivate);

// Rutas de copia e incremento
router.post('/copy/:id_anio_origen/:id_anio_destino', authMiddleware, historicoSalarioController.copyFromYear);
router.post('/incremento/:id_anio_origen/:id_anio_destino', authMiddleware, historicoSalarioController.aplicarIncremento);

module.exports = router;
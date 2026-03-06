const express = require('express');
const router = express.Router();
const historicoSalarioController = require('../controllers/HistoricoSalarioController');

// =============================================
// RUTAS DE HISTÓRICO DE SALARIOS
// Ruta base: /historico-salarios
// =============================================

// Rutas de consulta general
router.get('/anio/:id_anio_legal', historicoSalarioController.getByAnio);
router.get('/cargo/:id_cargo_base', historicoSalarioController.getHistorialByCargo);
router.get('/cargo/:id_cargo_base/comparativo', historicoSalarioController.getComparativo);
router.get('/cargo/:id_cargo_base/anio/:id_anio_legal', historicoSalarioController.getByCargoAndAnio);

// Rutas de operaciones
router.post('/', historicoSalarioController.upsert);
router.post('/lote', historicoSalarioController.configurarLote);
router.put('/:id', historicoSalarioController.update);
router.patch('/:id/activo', historicoSalarioController.setActivo);
router.delete('/:id', historicoSalarioController.deactivate);

// Rutas de copia e incremento
router.post('/copy/:id_anio_origen/:id_anio_destino', historicoSalarioController.copyFromYear);
router.post('/incremento/:id_anio_origen/:id_anio_destino', historicoSalarioController.aplicarIncremento);

module.exports = router;
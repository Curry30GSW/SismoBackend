const express = require('express');
const router = express.Router();
const posicionCargoController = require('../controllers/posicionCargoController');

// =============================================
// RUTAS PRINCIPALES PARA TU COMPONENTE
// =============================================

// ¡ESTA ES LA RUTA QUE USA TU COMPONENTE!
// GET /api/posiciones-cargo/disponibilidad/1
router.get('/disponibilidad/:id_anio_legal', posicionCargoController.getDisponibilidad);

// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', posicionCargoController.create);
router.get('/:id', posicionCargoController.getById);
router.put('/:id', posicionCargoController.update);
router.delete('/:id', posicionCargoController.delete);

// =============================================
// RUTAS POR AÑO (CON FILTROS)
// =============================================
// GET /api/posiciones-cargo/anio/1?estado=disponible&id_cargo_base=2
router.get('/anio/:id_anio_legal', posicionCargoController.getAllByAnio);

// =============================================
// RUTAS ESPECÍFICAS
// =============================================

// Por departamento
router.get('/anio/:id_anio_legal/departamento/:id_departamento', posicionCargoController.getByDepartamento);

// Por cargo
router.get('/anio/:id_anio_legal/cargo/:id_cargo_base', posicionCargoController.getByCargo);

// Por estado
router.get('/anio/:id_anio_legal/estado/:estado', posicionCargoController.getByEstado);

// Copiar posiciones de un año a otro
router.post('/copy/:id_anio_origen/:id_anio_destino', posicionCargoController.copyFromYear);

module.exports = router;
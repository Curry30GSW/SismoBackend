const express = require('express');
const router = express.Router();
const anioLegalController = require('../controllers/anioLegalController');

// Rutas básicas
router.post('/', anioLegalController.create);
router.get('/', anioLegalController.getAll);
router.get('/current', anioLegalController.getCurrentYear);
router.get('/:id', anioLegalController.getById);
router.get('/anio/:anio', anioLegalController.getByAnio);
router.put('/:id', anioLegalController.update);
router.patch('/:id/activo', anioLegalController.setActivo);
router.delete('/:id', anioLegalController.delete);

// Rutas específicas de negocio
router.post('/apertura', anioLegalController.abrirNuevoAnio);
router.get('/:id/estadisticas', anioLegalController.getEstadisticas);
router.get('/comparar/:id1/:id2', anioLegalController.compararAnios);

module.exports = router;
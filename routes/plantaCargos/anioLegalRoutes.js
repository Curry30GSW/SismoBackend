const express = require('express');
const router = express.Router();
const anioLegalController = require('../../controllers/plantaCargos/anioLegalController');
const { authMiddleware } = require('../../middlewares/authMiddleware');


// Rutas básicas
router.post('/', authMiddleware, anioLegalController.create);
router.get('/', authMiddleware, anioLegalController.getAll);
router.get('/current', authMiddleware, anioLegalController.getCurrentYear);
router.get('/:id', authMiddleware, anioLegalController.getById);
router.get('/anio/:anio', authMiddleware, anioLegalController.getByAnio);
router.put('/:id', authMiddleware, anioLegalController.update);
router.patch('/:id/activo', authMiddleware, anioLegalController.setActivo);
router.delete('/:id', authMiddleware, anioLegalController.delete);

// Rutas específicas de negocio
router.post('/apertura', authMiddleware, anioLegalController.abrirNuevoAnio);
router.get('/:id/estadisticas', authMiddleware, anioLegalController.getEstadisticas);
router.get('/comparar/:id1/:id2', authMiddleware, anioLegalController.compararAnios);

module.exports = router;
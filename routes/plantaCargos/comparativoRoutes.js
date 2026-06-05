const express = require('express');
const router = express.Router();
const comparativoController = require('../../controllers/plantaCargos/comparativoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Rutas para comparativos
router.get('/cargos/:id1/:id2', authMiddleware, comparativoController.compararCargos);
router.get('/departamentos/:id1/:id2', authMiddleware, comparativoController.compararDepartamentos);
router.get('/resumen/:id1/:id2', authMiddleware, comparativoController.resumenComparativo);
router.get('/resumen-anio/:id_anio_legal', authMiddleware, comparativoController.getResumenAnioActual);

module.exports = router;
const express = require('express');
const router = express.Router();
const comparativoController = require('../../controllers/plantaCargos/comparativoController');

// Rutas para comparativos
router.get('/cargos/:id1/:id2', comparativoController.compararCargos);
router.get('/departamentos/:id1/:id2', comparativoController.compararDepartamentos);
router.get('/resumen/:id1/:id2', comparativoController.resumenComparativo);
router.get('/resumen-anio/:id_anio_legal', comparativoController.getResumenAnioActual);

module.exports = router;
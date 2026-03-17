const express = require('express');
const router = express.Router();
const tipoPlantaController = require('../../controllers/plantaCargos/tipoPlantaController');

// Rutas básicas
router.get('/', tipoPlantaController.getAll);
router.get('/with-stats', tipoPlantaController.getWithStats);
router.get('/:id', tipoPlantaController.getById);
router.post('/', tipoPlantaController.create);
router.put('/:id', tipoPlantaController.update);
router.delete('/:id', tipoPlantaController.delete);

module.exports = router;
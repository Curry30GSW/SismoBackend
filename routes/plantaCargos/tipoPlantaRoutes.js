const express = require('express');
const router = express.Router();
const tipoPlantaController = require('../../controllers/plantaCargos/tipoPlantaController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Rutas básicas
router.get('/', authMiddleware, tipoPlantaController.getAll);
router.get('/with-stats', authMiddleware, tipoPlantaController.getWithStats);
router.get('/:id', authMiddleware, tipoPlantaController.getById);
router.post('/', authMiddleware, tipoPlantaController.create);
router.put('/:id', authMiddleware, tipoPlantaController.update);
router.delete('/:id', authMiddleware, tipoPlantaController.delete);

module.exports = router;
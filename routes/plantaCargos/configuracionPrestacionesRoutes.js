const express = require('express');
const router = express.Router();
const configuracionPrestacionesController = require('../../controllers/plantaCargos/configuracionPrestacionesController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.get('/', authMiddleware, configuracionPrestacionesController.getAll);
router.get('/:id', authMiddleware, configuracionPrestacionesController.getById);
router.post('/', authMiddleware, configuracionPrestacionesController.create);
router.put('/:id', authMiddleware, configuracionPrestacionesController.update);
router.delete('/:id', authMiddleware, configuracionPrestacionesController.delete);

module.exports = router;
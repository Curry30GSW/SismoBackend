const express = require('express');
const router = express.Router();
const configuracionPrestacionesController = require('../controllers/configuracionPrestacionesController');

router.get('/', configuracionPrestacionesController.getAll);
router.get('/:id', configuracionPrestacionesController.getById);
router.post('/', configuracionPrestacionesController.create);
router.put('/:id', configuracionPrestacionesController.update);
router.delete('/:id', configuracionPrestacionesController.delete);

module.exports = router;
const express = require('express');
const router = express.Router();
const NombramientoController = require('../../controllers/Contratos/nombramientosController');

// Crear un nuevo cambio de modalidad
router.post('/', NombramientoController.create);

// Obtener un cambio de modalidad por ID
router.get('/:id', NombramientoController.getById);


module.exports = router;
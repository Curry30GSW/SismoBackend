const express = require('express');
const router = express.Router();
const NombramientoController = require('../../controllers/Contratos/nombramientosController');

// Crear un nuevo cambio de modalidad
router.post('/', NombramientoController.create);

// Obtener todos los nombramientos (con filtros y paginación)
router.get('/', NombramientoController.getAll);

// Obtener un cambio de modalidad por ID
router.get('/:id', NombramientoController.getById);

// Obtener nombramientos por funcionario
router.get('/funcionario/:idFuncionario', NombramientoController.getByFuncionario);

// Obtener nombramientos pendientes
router.get('/pendientes', NombramientoController.getPendientes);

// Marcar nombramiento como ejecutado
router.put('/:id/ejecutar', NombramientoController.marcarEjecutado);


module.exports = router;
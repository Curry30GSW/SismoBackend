const express = require('express');
const router = express.Router();
const trasladoController = require('../../controllers/Contratos/TrasladoController');


// GET /api/traslados/funcionario/:id_funcionario - Obtener traslados por funcionario
router.get('/funcionario/:id_funcionario', trasladoController.getByFuncionario);

// =============================================
// RUTAS GENÉRICAS
// =============================================

// GET /api/traslados - Obtener todos los traslados
router.get('/', trasladoController.getAll);

// GET /api/traslados/:id - Obtener traslado por ID
router.get('/:id', trasladoController.getById);

// POST /api/traslados - Crear nuevo traslado
router.post('/', trasladoController.create);

router.put('/:id/finalizar', trasladoController.finalizar);

module.exports = router;
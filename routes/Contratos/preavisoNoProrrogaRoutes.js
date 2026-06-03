const express = require('express');
const router = express.Router();
const preavisoNoProrrogaController = require('../../controllers/Contratos/preavisoNoProrrogaController');


// Crear preaviso para un contrato específico
router.post('/contrato/:id/preaviso', preavisoNoProrrogaController.create);

// Verificar si un contrato tiene preaviso activo
router.get('/contrato/:id/preaviso/verificar', preavisoNoProrrogaController.verificarPreaviso);

// Cancelar preaviso de un contrato
router.delete('/contrato/:id/preaviso', preavisoNoProrrogaController.cancelar);

router.get('/', preavisoNoProrrogaController.getAll);

router.get('/:id', preavisoNoProrrogaController.getById);
module.exports = router;
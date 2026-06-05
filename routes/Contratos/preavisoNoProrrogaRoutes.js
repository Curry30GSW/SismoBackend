const express = require('express');
const router = express.Router();
const preavisoNoProrrogaController = require('../../controllers/Contratos/preavisoNoProrrogaController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Crear preaviso para un contrato específico
router.post('/contrato/:id/preaviso', authMiddleware, preavisoNoProrrogaController.create);

// Verificar si un contrato tiene preaviso activo
router.get('/contrato/:id/preaviso/verificar', authMiddleware, preavisoNoProrrogaController.verificarPreaviso);

// Cancelar preaviso de un contrato
router.delete('/contrato/:id/preaviso', authMiddleware, preavisoNoProrrogaController.cancelar);

router.get('/', authMiddleware, preavisoNoProrrogaController.getAll);

router.get('/:id', authMiddleware, preavisoNoProrrogaController.getById);
module.exports = router;
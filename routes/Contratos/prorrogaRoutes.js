const express = require('express');
const router = express.Router();
const prorrogaController = require('../../controllers/Contratos/prorrogaController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Rutas para prórrogas
router.post('/contrato/:id/prorrogar', authMiddleware, prorrogaController.create);
router.get('/contrato/:id/prorrogas', authMiddleware, prorrogaController.getByContrato);
router.get('/contrato/:id/cantidad-prorrogas', authMiddleware, prorrogaController.getCantidadByContrato);
router.get('/contrato/:id/verificar-prorroga', authMiddleware, prorrogaController.verificarProrroga);

router.get('/', authMiddleware, prorrogaController.getAll);

router.get('/:id', authMiddleware, prorrogaController.getById);



module.exports = router;
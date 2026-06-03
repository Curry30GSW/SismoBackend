const express = require('express');
const router = express.Router();
const prorrogaController = require('../../controllers/Contratos/prorrogaController');

// Rutas para prórrogas
router.post('/contrato/:id/prorrogar', prorrogaController.create);
router.get('/contrato/:id/prorrogas', prorrogaController.getByContrato);
router.get('/contrato/:id/cantidad-prorrogas', prorrogaController.getCantidadByContrato);
router.get('/contrato/:id/verificar-prorroga', prorrogaController.verificarProrroga);

router.get('/', prorrogaController.getAll);

router.get('/:id', prorrogaController.getById);



module.exports = router;
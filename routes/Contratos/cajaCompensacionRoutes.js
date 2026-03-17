const express = require('express');
const router = express.Router();
const cajaCompensacionController = require('../../controllers/Contratos/cajaCompensacionController');

router.post('/', cajaCompensacionController.create);
router.get('/', cajaCompensacionController.getAll);
router.get('/codigo/:codigo', cajaCompensacionController.getByCodigo);
router.get('/:id', cajaCompensacionController.getById);
router.put('/:id', cajaCompensacionController.update);
router.delete('/:id', cajaCompensacionController.delete);

module.exports = router;
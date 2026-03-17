const express = require('express');
const router = express.Router();
const cesantiasController = require('../../controllers/Contratos/cesantiasController');

router.post('/', cesantiasController.create);
router.get('/', cesantiasController.getAll);
router.get('/codigo/:codigo', cesantiasController.getByCodigo);
router.get('/:id', cesantiasController.getById);
router.put('/:id', cesantiasController.update);
router.delete('/:id', cesantiasController.delete);

module.exports = router;
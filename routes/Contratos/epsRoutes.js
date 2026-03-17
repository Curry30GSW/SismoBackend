const express = require('express');
const router = express.Router();
const epsController = require('../../controllers/Contratos/epsController');

router.post('/', epsController.create);
router.get('/', epsController.getAll);
router.get('/codigo/:codigo', epsController.getByCodigo);
router.get('/:id', epsController.getById);
router.put('/:id', epsController.update);
router.delete('/:id', epsController.delete);

module.exports = router;
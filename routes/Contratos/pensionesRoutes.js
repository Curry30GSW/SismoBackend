const express = require('express');
const router = express.Router();
const pensionesController = require('../../controllers/Contratos/pensionesController');

router.post('/', pensionesController.create);
router.get('/', pensionesController.getAll);
router.get('/codigo/:codigo', pensionesController.getByCodigo);
router.get('/:id', pensionesController.getById);
router.put('/:id', pensionesController.update);
router.delete('/:id', pensionesController.delete);

module.exports = router;
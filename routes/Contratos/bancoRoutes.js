const express = require('express');
const router = express.Router();
const bancoController = require('../../controllers/Contratos/bancoController');

router.post('/', bancoController.create);
router.get('/', bancoController.getAll);
router.get('/:id', bancoController.getById);
router.put('/:id', bancoController.update);
router.delete('/:id', bancoController.delete);

module.exports = router;
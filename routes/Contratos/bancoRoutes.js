const express = require('express');
const router = express.Router();
const bancoController = require('../../controllers/Contratos/bancoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, bancoController.create);
router.get('/', authMiddleware, bancoController.getAll);
router.get('/:id', authMiddleware, bancoController.getById);
router.put('/:id', authMiddleware, bancoController.update);
router.delete('/:id', authMiddleware, bancoController.delete);

module.exports = router;
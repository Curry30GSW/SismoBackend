const express = require('express');
const router = express.Router();
const cajaCompensacionController = require('../../controllers/Contratos/cajaCompensacionController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, cajaCompensacionController.create);
router.get('/', authMiddleware, cajaCompensacionController.getAll);
router.get('/codigo/:codigo', authMiddleware, cajaCompensacionController.getByCodigo);
router.get('/:id', authMiddleware, cajaCompensacionController.getById);
router.put('/:id', authMiddleware, cajaCompensacionController.update);
router.delete('/:id', authMiddleware, cajaCompensacionController.delete);

module.exports = router;
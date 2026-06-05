const express = require('express');
const router = express.Router();
const pensionesController = require('../../controllers/Contratos/pensionesController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, pensionesController.create);
router.get('/', authMiddleware, pensionesController.getAll);
router.get('/codigo/:codigo', authMiddleware, pensionesController.getByCodigo);
router.get('/:id', authMiddleware, pensionesController.getById);
router.put('/:id', authMiddleware, pensionesController.update);
router.delete('/:id', authMiddleware, pensionesController.delete);

module.exports = router;
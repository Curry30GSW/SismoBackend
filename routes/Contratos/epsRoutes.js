const express = require('express');
const router = express.Router();
const epsController = require('../../controllers/Contratos/epsController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, epsController.create);
router.get('/', authMiddleware, epsController.getAll);
router.get('/codigo/:codigo', authMiddleware, epsController.getByCodigo);
router.get('/:id', authMiddleware, epsController.getById);
router.put('/:id', authMiddleware, epsController.update);
router.delete('/:id', authMiddleware, epsController.delete);

module.exports = router;
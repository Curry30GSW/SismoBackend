const express = require('express');
const router = express.Router();
const cesantiasController = require('../../controllers/Contratos/cesantiasController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, cesantiasController.create);
router.get('/', authMiddleware, cesantiasController.getAll);
router.get('/codigo/:codigo', authMiddleware, cesantiasController.getByCodigo);
router.get('/:id', authMiddleware, cesantiasController.getById);
router.put('/:id', authMiddleware, cesantiasController.update);
router.delete('/:id', authMiddleware, cesantiasController.delete);

module.exports = router;
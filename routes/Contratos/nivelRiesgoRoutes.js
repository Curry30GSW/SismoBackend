const express = require('express');
const router = express.Router();
const nivelRiesgoController = require('../../controllers/Contratos/nivelRiesgoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/', authMiddleware, nivelRiesgoController.create);
router.get('/', authMiddleware, nivelRiesgoController.getAll);
router.get('/:id', authMiddleware, nivelRiesgoController.getById);
router.put('/:id', authMiddleware, nivelRiesgoController.update);
router.delete('/:id', authMiddleware, nivelRiesgoController.delete);

module.exports = router;
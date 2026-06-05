const express = require('express');
const router = express.Router();
const DepartamentoController = require('../../controllers/plantaCargos/DepartamentoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.get('/departamentos', authMiddleware, DepartamentoController.getAll);
router.get('/departamentos-activos', authMiddleware, DepartamentoController.getActivos);
router.get('/departamentos/:id', authMiddleware, DepartamentoController.getById);
router.post('/create-departamento', authMiddleware, DepartamentoController.create);
router.put('/update-departamento/:id', authMiddleware, DepartamentoController.update);
router.delete('/delete-departamento/:id', authMiddleware, DepartamentoController.delete);

module.exports = router;

const express = require('express');
const router = express.Router();
const cargoBaseController = require('../../controllers/plantaCargos/cargoBaseController');
const { authMiddleware } = require('../../middlewares/authMiddleware');


// CRUD Básico
router.post('/', authMiddleware, cargoBaseController.create);
router.get('/', authMiddleware, cargoBaseController.getAll);
router.get('/:id', authMiddleware, cargoBaseController.getById);
router.put('/:id', authMiddleware, cargoBaseController.update);
router.delete('/:id', authMiddleware, cargoBaseController.delete);

// Rutas específicas
router.get('/nivel/:nivel', authMiddleware, cargoBaseController.getByNivel);
router.get('/directores/agencia', authMiddleware, cargoBaseController.getDirectoresAgencia);
router.get('/with/salario/:id_anio_legal', authMiddleware, cargoBaseController.getWithSalarioHistorico);
router.get('/with/disponibilidad/:id_anio_legal', authMiddleware, cargoBaseController.getWithDisponibilidad);
router.patch('/:id/activo', authMiddleware, cargoBaseController.setActivo);
router.get('/codigo/:codigo', authMiddleware, cargoBaseController.getByCodigo);

module.exports = router;
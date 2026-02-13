const express = require('express');
const router = express.Router();
const cargoBaseController = require('../controllers/cargoBaseController');

// NOTA: Aquí NO va /api, solo el recurso
// La ruta base será /cargos-base

// CRUD Básico
router.post('/', cargoBaseController.create);
router.get('/', cargoBaseController.getAll);
router.get('/:id', cargoBaseController.getById);
router.put('/:id', cargoBaseController.update);
router.delete('/:id', cargoBaseController.delete);

// Rutas específicas
router.get('/nivel/:nivel', cargoBaseController.getByNivel);
router.get('/directores/agencia', cargoBaseController.getDirectoresAgencia);
router.get('/with/salario/:id_anio_legal', cargoBaseController.getWithSalarioHistorico);
router.get('/with/disponibilidad/:id_anio_legal', cargoBaseController.getWithDisponibilidad);
router.patch('/:id/activo', cargoBaseController.setActivo);
router.get('/codigo/:codigo', cargoBaseController.getByCodigo);

module.exports = router;
const express = require('express');
const router = express.Router();
const categoriaDirectorController = require('../../controllers/plantaCargos/categoriaDirectorController');

// =============================================
// RUTAS DE CATEGORÍAS DE DIRECTOR
// Ruta base: /categorias-director
// =============================================

// CRUD Básico
router.post('/', categoriaDirectorController.create);
router.get('/', categoriaDirectorController.getAll);
router.get('/:id', categoriaDirectorController.getById);
router.put('/:id', categoriaDirectorController.update);
router.delete('/:id', categoriaDirectorController.delete);

// Rutas específicas
router.get('/codigo/:codigo', categoriaDirectorController.getByCodigo);
router.get('/rango/:numClientes', categoriaDirectorController.getByRangoClientes);
router.get('/with/stats/:id_anio_legal', categoriaDirectorController.getWithStats);
router.patch('/:id/activo', categoriaDirectorController.setActivo);
router.get('/validar/rango', categoriaDirectorController.validarRango);

module.exports = router;
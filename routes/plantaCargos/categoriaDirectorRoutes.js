const express = require('express');
const router = express.Router();
const categoriaDirectorController = require('../../controllers/plantaCargos/categoriaDirectorController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// RUTAS DE CATEGORÍAS DE DIRECTOR
// Ruta base: /categorias-director
// =============================================

// CRUD Básico
router.post('/', authMiddleware, categoriaDirectorController.create);
router.get('/', authMiddleware, categoriaDirectorController.getAll);
router.get('/:id', authMiddleware, categoriaDirectorController.getById);
router.put('/:id', authMiddleware, categoriaDirectorController.update);
router.delete('/:id', authMiddleware, categoriaDirectorController.delete);

// Rutas específicas
router.get('/codigo/:codigo', authMiddleware, categoriaDirectorController.getByCodigo);
router.get('/rango/:numClientes', authMiddleware, categoriaDirectorController.getByRangoClientes);
router.get('/with/stats/:id_anio_legal', authMiddleware, categoriaDirectorController.getWithStats);
router.patch('/:id/activo', authMiddleware, categoriaDirectorController.setActivo);
router.get('/validar/rango', authMiddleware, categoriaDirectorController.validarRango);

module.exports = router;
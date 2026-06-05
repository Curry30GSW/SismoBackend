const express = require('express');
const router = express.Router();
const CategoriaDirectorController = require('../../controllers/plantaCargos/DirectoresController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

router.post('/create-director', authMiddleware, CategoriaDirectorController.create);
router.get('/directores-categorias', authMiddleware, CategoriaDirectorController.getAll);
router.get('/directores/:id', authMiddleware, CategoriaDirectorController.getById);
router.put('/update-director/:id', authMiddleware, CategoriaDirectorController.update);
router.delete('/delete-director/:id', authMiddleware, CategoriaDirectorController.delete);

module.exports = router;
const express = require('express');
const router = express.Router();
const CategoriaDirectorController = require('../controllers/DirectoresController');


router.post('/create-director', CategoriaDirectorController.create);
router.get('/directores-categorias', CategoriaDirectorController.getAll);
router.get('/directores/:id', CategoriaDirectorController.getById);
router.put('/update-director/:id', CategoriaDirectorController.update);
router.delete('/delete-director/:id', CategoriaDirectorController.delete);

module.exports = router;
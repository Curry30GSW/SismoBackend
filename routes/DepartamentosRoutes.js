const express = require('express');
const router = express.Router();
const DepartamentoController = require('../controllers/DepartamentoController');

router.get('/departamentos', DepartamentoController.getAll);
router.get('/departamentos/:id', DepartamentoController.getById);
router.post('/create-departamento', DepartamentoController.create);
router.put('/update-departamento/:id', DepartamentoController.update);
router.delete('/delete-departamento/:id', DepartamentoController.delete);

module.exports = router;

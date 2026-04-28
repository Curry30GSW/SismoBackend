const express = require('express');
const router = express.Router();
const contratoController = require('../../controllers/Contratos/contratoController');

// =============================================
// RUTAS PÚBLICAS / DATOS MAESTROS
// =============================================
router.get('/form-data', contratoController.getFormData);
router.get('/niveles-riesgo/:id_arl', contratoController.getNivelesRiesgo);

// =============================================
// BÚSQUEDA DE FUNCIONARIOS (autocompletado)
// =============================================
router.get('/buscar-funcionario/:documento', contratoController.buscarFuncionario);

// =============================================
// CRUD CONTRATOS
// =============================================
router.post('/', contratoController.create);
router.post('/cambiar-indefinido/:id', contratoController.cambiarAIndefinido);
router.get('/', contratoController.getAll);
router.get('/funcionario/:id_funcionario', contratoController.getByFuncionario);
router.get('/:id', contratoController.getById);
router.put('/:id', contratoController.update);

// =============================================
// ACCIONES ESPECÍFICAS
// =============================================
router.patch('/:id/finalizar', contratoController.finalizar);
router.patch('/:id/prorrogar', contratoController.prorrogar);
router.delete('/:id', contratoController.delete);

// =============================================
// GESTIÓN DE CLÁUSULAS
// =============================================
router.patch('/clausulas/:id', contratoController.updateClausula);

module.exports = router;
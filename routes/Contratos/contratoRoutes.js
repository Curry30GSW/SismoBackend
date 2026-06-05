const express = require('express');
const router = express.Router();
const contratoController = require('../../controllers/Contratos/contratoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// RUTAS PÚBLICAS / DATOS MAESTROS
// =============================================
router.get('/form-data', authMiddleware, contratoController.getFormData);
router.get('/niveles-riesgo/:id_arl', authMiddleware, contratoController.getNivelesRiesgo);

// =============================================
// BÚSQUEDA DE FUNCIONARIOS (autocompletado)
// =============================================
router.get('/buscar-funcionario/:documento', authMiddleware, contratoController.buscarFuncionario);

// =============================================
// CRUD CONTRATOS
// =============================================
router.post('/', authMiddleware, contratoController.create);
router.post('/cambiar-indefinido/:id', authMiddleware, contratoController.cambiarAIndefinido);
router.get('/', authMiddleware, contratoController.getAll);
router.get('/funcionario/:id_funcionario', authMiddleware, contratoController.getByFuncionario);
router.get('/:id', authMiddleware, contratoController.getById);
router.put('/:id', authMiddleware, contratoController.update);

// =============================================
// ACCIONES ESPECÍFICAS
// =============================================
router.post('/:id/finalizar', authMiddleware, contratoController.finalizarContrato);
router.patch('/:id/prorrogar', authMiddleware, contratoController.prorrogar);
router.delete('/:id', authMiddleware, contratoController.delete);

// =============================================
// GESTIÓN DE CLÁUSULAS
// =============================================
router.patch('/clausulas/:id', authMiddleware, contratoController.updateClausula);

module.exports = router;
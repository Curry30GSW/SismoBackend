const express = require('express');
const router = express.Router();
const ascensoController = require('../../controllers/Contratos/AscensoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');


// POST /api/ascensos - Crear nuevo ascenso
router.post('/', authMiddleware, ascensoController.create);

// GET /api/ascensos - Obtener todos los ascensos (paginado)
router.get('/', authMiddleware, ascensoController.getAll);

// GET /api/ascensos/:id - Obtener ascenso por ID (con todos los datos)
router.get('/:id', authMiddleware, ascensoController.getById);

// =============================================
// RUTAS ESPECÍFICAS (siempre antes de las genéricas)
// =============================================

// GET /api/ascensos/funcionario/:id_funcionario - Ascensos por funcionario
router.get('/funcionario/:id_funcionario', authMiddleware, ascensoController.getByFuncionario);

// GET /api/ascensos/:id/pdf - Generar PDF de carta de ascenso
router.get('/:id/pdf', authMiddleware, ascensoController.generarPdfAscenso);

module.exports = router;
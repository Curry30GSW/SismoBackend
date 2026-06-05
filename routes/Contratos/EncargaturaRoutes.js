const express = require('express');
const router = express.Router();
const encargaturaController = require('../../controllers/Contratos/EncargaturaController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// RUTAS PRINCIPALES
// =============================================

// GET /api/encargaturas/generar-codigo - Generar código de encargatura
router.get('/generar-codigo', authMiddleware, encargaturaController.generarCodigo);

// POST /api/encargaturas - Crear nueva encargatura
router.post('/', authMiddleware, encargaturaController.create);

router.put('/:id_encargatura/finalizar', authMiddleware, encargaturaController.finalizarEncargatura);

// GET /api/encargaturas - Obtener todas las encargaturas (paginado)
router.get('/', authMiddleware, encargaturaController.getAll);

// GET /api/encargaturas/activas - Obtener encargaturas activas
router.get('/activas', authMiddleware, encargaturaController.getActivas);

// GET /api/encargaturas/:id - Obtener encargatura por ID
router.get('/:id', authMiddleware, encargaturaController.getById);

// =============================================
// RUTAS ESPECÍFICAS
// =============================================

// GET /api/encargaturas/funcionario/:id_funcionario - Encargaturas por funcionario
router.get('/funcionario/:id_funcionario', authMiddleware, encargaturaController.getByFuncionario);

module.exports = router;
const express = require('express');
const router = express.Router();
const encargaturaController = require('../../controllers/Contratos/EncargaturaController');

// =============================================
// RUTAS PRINCIPALES
// =============================================

// GET /api/encargaturas/generar-codigo - Generar código de encargatura
router.get('/generar-codigo', encargaturaController.generarCodigo);

// POST /api/encargaturas - Crear nueva encargatura
router.post('/', encargaturaController.create);

router.put('/:id_encargatura/finalizar', encargaturaController.finalizarEncargatura);

// GET /api/encargaturas - Obtener todas las encargaturas (paginado)
router.get('/', encargaturaController.getAll);

// GET /api/encargaturas/activas - Obtener encargaturas activas
router.get('/activas', encargaturaController.getActivas);

// GET /api/encargaturas/:id - Obtener encargatura por ID
router.get('/:id', encargaturaController.getById);

// =============================================
// RUTAS ESPECÍFICAS
// =============================================

// GET /api/encargaturas/funcionario/:id_funcionario - Encargaturas por funcionario
router.get('/funcionario/:id_funcionario', encargaturaController.getByFuncionario);

module.exports = router;
const express = require('express');
const router = express.Router();
const ascensoController = require('../../controllers/Contratos/AscensoController');



// POST /api/ascensos - Crear nuevo ascenso
router.post('/', ascensoController.create);

// GET /api/ascensos - Obtener todos los ascensos (paginado)
router.get('/', ascensoController.getAll);

// GET /api/ascensos/:id - Obtener ascenso por ID (con todos los datos)
router.get('/:id', ascensoController.getById);

// =============================================
// RUTAS ESPECÍFICAS (siempre antes de las genéricas)
// =============================================

// GET /api/ascensos/funcionario/:id_funcionario - Ascensos por funcionario
router.get('/funcionario/:id_funcionario', ascensoController.getByFuncionario);

// GET /api/ascensos/:id/pdf - Generar PDF de carta de ascenso
router.get('/:id/pdf', ascensoController.generarPdfAscenso);

module.exports = router;
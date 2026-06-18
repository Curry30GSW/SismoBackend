const express = require('express');
const router = express.Router();
const documentoVerificacionController = require('../../controllers/main/documentoVerificacionController');
const { authMiddleware } = require('../../middlewares/authMiddleware');


router.get('/public/verificar/:codigo', documentoVerificacionController.verificarPublico);

// POST /api/documentos-verificacion/generar - Generar código
router.post('/generar', documentoVerificacionController.generarCodigo);

// GET /api/documentos-verificacion/verificar/:codigo - Verificar código
router.get('/verificar/:codigo', documentoVerificacionController.verificar);

// GET /api/documentos-verificacion/referencia/:tipo/:id - Obtener por referencia
router.get('/referencia/:tipo/:id', documentoVerificacionController.obtenerPorReferencia);

module.exports = router;
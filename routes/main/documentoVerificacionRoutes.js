const express = require('express');
const router = express.Router();
const documentoVerificacionController = require('../../controllers/main/documentoVerificacionController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// POST /api/documentos-verificacion/generar - Generar código
router.post('/generar', authMiddleware, documentoVerificacionController.generarCodigo);

// GET /api/documentos-verificacion/verificar/:codigo - Verificar código
router.get('/verificar/:codigo', authMiddleware, documentoVerificacionController.verificar);

// GET /api/documentos-verificacion/referencia/:tipo/:id - Obtener por referencia
router.get('/referencia/:tipo/:id', authMiddleware, documentoVerificacionController.obtenerPorReferencia);

module.exports = router;
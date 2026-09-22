const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// ────────────── RUTAS PÚBLICAS (sin auth) ──────────────
router.get('/publico/:token', eventoController.obtenerPorToken);
router.post('/publico/:token/reportar', eventoController.reportarPublico);

// ────────────── RUTAS PRIVADAS (con auth) ──────────────
router.use(authMiddleware);

router.post('/', eventoController.crear);
router.get('/', eventoController.listar);
router.get('/activos', eventoController.listarActivos);
router.get('/:id', eventoController.obtener);
router.put('/:id/activo', eventoController.actualizarActivo);
router.post('/:id/reportar', eventoController.reportar);
router.get('/:id/resumen', eventoController.resumen);

module.exports = router;
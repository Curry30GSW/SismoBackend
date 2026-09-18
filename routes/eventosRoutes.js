const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

router.post('/', eventoController.crear);
router.get('/', eventoController.listar);
router.get('/activos', eventoController.listarActivos);

router.post('/:id/reportar', eventoController.reportar);
router.get('/:id/resumen', eventoController.resumen);

router.get('/:id', eventoController.obtener);
router.put('/:id', eventoController.actualizarActivo);

module.exports = router;
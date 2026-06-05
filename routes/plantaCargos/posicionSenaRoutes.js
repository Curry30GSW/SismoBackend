const express = require('express');
const router = express.Router();
const posicionSenaController = require('../../controllers/plantaCargos/posicionSenaController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', posicionSenaController.create);
router.get('/disponibilidad/:id_anio_legal', authMiddleware, posicionSenaController.getDisponibilidad);
router.get('/anio/:id_anio_legal', authMiddleware, posicionSenaController.getAllByAnio);
router.get('/:id', authMiddleware, posicionSenaController.getById);
router.put('/:id', authMiddleware, posicionSenaController.update);
router.delete('/:id', authMiddleware, posicionSenaController.delete);

// =============================================
// MÉTODOS ESPECÍFICOS DE SENA
// =============================================
router.get('/proximos-vencer/:id_anio_legal', authMiddleware, posicionSenaController.getProximosAVencer);

// =============================================
// ASIGNACIÓN DE APRENDICES
// =============================================
router.post('/:id/asignar-aprendiz', authMiddleware, posicionSenaController.asignarAprendiz);
router.post('/:id/desasignar-aprendiz', authMiddleware, posicionSenaController.desasignarAprendiz);

// =============================================
// COPIA DE AÑO
// =============================================
router.post('/copy/:id_anio_origen/:id_anio_destino', authMiddleware, posicionSenaController.copyFromYear);

module.exports = router;
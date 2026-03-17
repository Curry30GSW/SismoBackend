const express = require('express');
const router = express.Router();
const posicionSenaController = require('../../controllers/plantaCargos/posicionSenaController');

// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', posicionSenaController.create);
router.get('/disponibilidad/:id_anio_legal', posicionSenaController.getDisponibilidad);
router.get('/anio/:id_anio_legal', posicionSenaController.getAllByAnio);
router.get('/:id', posicionSenaController.getById);
router.put('/:id', posicionSenaController.update);
router.delete('/:id', posicionSenaController.delete);

// =============================================
// MÉTODOS ESPECÍFICOS DE SENA
// =============================================
router.get('/proximos-vencer/:id_anio_legal', posicionSenaController.getProximosAVencer);

// =============================================
// ASIGNACIÓN DE APRENDICES
// =============================================
router.post('/:id/asignar-aprendiz', posicionSenaController.asignarAprendiz);
router.post('/:id/desasignar-aprendiz', posicionSenaController.desasignarAprendiz);

// =============================================
// COPIA DE AÑO
// =============================================
router.post('/copy/:id_anio_origen/:id_anio_destino', posicionSenaController.copyFromYear);

module.exports = router;
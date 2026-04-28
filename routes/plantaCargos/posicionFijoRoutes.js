const express = require('express');
const router = express.Router();
const posicionFijoController = require('../../controllers/plantaCargos/PosicionFijoController');

// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', posicionFijoController.create);
router.get('/disponibilidad/:id_anio_legal', posicionFijoController.getDisponibilidad);
router.get('/anio/:id_anio_legal', posicionFijoController.getAllByAnio);
router.get('/:id', posicionFijoController.getById);
router.put('/:id', posicionFijoController.update);
router.delete('/:id', posicionFijoController.delete);

// =============================================
// ASIGNACIÓN DE FUNCIONARIOS
// =============================================
router.post('/:id/asignar-funcionario', posicionFijoController.asignarFuncionario);
router.post('/:id/desasignar-funcionario', posicionFijoController.desasignarFuncionario);

// =============================================
// TRASLADOS
// =============================================
router.post('/:id/trasladar-cargo', posicionFijoController.trasladarCargo);

// =============================================
// COPIA DE AÑO
// =============================================
router.post('/copy/:id_anio_origen/:id_anio_destino', posicionFijoController.copyFromYear);

router.get('/funcionario/:idFuncionario/posicion-activa', posicionFijoController.getPosicionFuncionario);
router.get('/funcionario/:idFuncionario/verificar-posicion', posicionFijoController.verificarPosicionActiva);

module.exports = router;
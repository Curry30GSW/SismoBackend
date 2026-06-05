const express = require('express');
const router = express.Router();
const posicionFijoController = require('../../controllers/plantaCargos/PosicionFijoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', authMiddleware, posicionFijoController.create);
router.get('/disponibilidad/:id_anio_legal', authMiddleware, posicionFijoController.getDisponibilidad);
router.get('/anio/:id_anio_legal', authMiddleware, posicionFijoController.getAllByAnio);
router.get('/:id', authMiddleware, posicionFijoController.getById);
router.put('/:id', authMiddleware, posicionFijoController.update);
router.delete('/:id', authMiddleware, posicionFijoController.delete);

// =============================================
// ASIGNACIÓN DE FUNCIONARIOS
// =============================================
router.post('/:id/asignar-funcionario', authMiddleware, posicionFijoController.asignarFuncionario);
router.post('/:id/desasignar-funcionario', authMiddleware, posicionFijoController.desasignarFuncionario);

// =============================================
// TRASLADOS
// =============================================
router.post('/:id/trasladar-cargo', authMiddleware, posicionFijoController.trasladarCargo);

// =============================================
// COPIA DE AÑO
// =============================================
router.post('/copy/:id_anio_origen/:id_anio_destino', authMiddleware, posicionFijoController.copyFromYear);

router.get('/funcionario/:idFuncionario/posicion-activa', authMiddleware, posicionFijoController.getPosicionFuncionario);
router.get('/funcionario/:idFuncionario/verificar-posicion', authMiddleware, posicionFijoController.verificarPosicionActiva);

module.exports = router;
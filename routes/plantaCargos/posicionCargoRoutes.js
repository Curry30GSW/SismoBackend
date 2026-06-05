const express = require('express');
const router = express.Router();
const posicionCargoController = require('../../controllers/plantaCargos/posicionCargoController');
const { authMiddleware } = require('../../middlewares/authMiddleware');
// =============================================
// RUTAS PRINCIPALES PARA TU COMPONENTE
// =============================================
router.post('/:id/trasladar-cargo', authMiddleware, posicionCargoController.trasladarCargo);
router.post('/:id/trasladar-funcionario', authMiddleware, posicionCargoController.trasladarFuncionario);
router.post('/reordenar/:id_anio_legal', authMiddleware, posicionCargoController.reordenarPosiciones);
router.get('/disponibilidad/:id_anio_legal', authMiddleware, posicionCargoController.getDisponibilidad);

// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', authMiddleware, posicionCargoController.create);
router.get('/:id', authMiddleware, posicionCargoController.getById);
router.put('/:id', authMiddleware, posicionCargoController.update);
router.put('/:id/cambiar-categoria', authMiddleware, posicionCargoController.cambiarCargoBase);
router.delete('/:id', authMiddleware, posicionCargoController.delete);

router.post('/:id/desasignar', authMiddleware, posicionCargoController.desasignarFuncionario);

router.get('/anio/:id_anio_legal', authMiddleware, posicionCargoController.getAllByAnio);

// =============================================
// RUTAS ESPECÍFICAS
// =============================================

// Por departamento
router.get('/anio/:id_anio_legal/departamento/:id_departamento', authMiddleware, posicionCargoController.getByDepartamento);

// Por cargo
router.get('/anio/:id_anio_legal/cargo/:id_cargo_base', authMiddleware, posicionCargoController.getByCargo);

// Por estado
router.get('/anio/:id_anio_legal/estado/:estado', authMiddleware, posicionCargoController.getByEstado);

// Copiar posiciones de un año a otro
router.post('/copy/:id_anio_origen/:id_anio_destino', authMiddleware, posicionCargoController.copyFromYear);


router.post('/:id/asignar-funcionario', authMiddleware, posicionCargoController.asignarFuncionario);


module.exports = router;
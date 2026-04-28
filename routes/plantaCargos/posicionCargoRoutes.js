const express = require('express');
const router = express.Router();
const posicionCargoController = require('../../controllers/plantaCargos/posicionCargoController');

// =============================================
// RUTAS PRINCIPALES PARA TU COMPONENTE
// =============================================
router.post('/:id/trasladar-cargo', posicionCargoController.trasladarCargo);
router.post('/:id/trasladar-funcionario', posicionCargoController.trasladarFuncionario);
router.post('/reordenar/:id_anio_legal', posicionCargoController.reordenarPosiciones);
router.get('/disponibilidad/:id_anio_legal', posicionCargoController.getDisponibilidad);

// =============================================
// CRUD BÁSICO
// =============================================
router.post('/', posicionCargoController.create);
router.get('/:id', posicionCargoController.getById);
router.put('/:id', posicionCargoController.update);
router.put('/:id/cambiar-categoria', posicionCargoController.cambiarCargoBase);
router.delete('/:id', posicionCargoController.delete);

router.post('/:id/desasignar', posicionCargoController.desasignarFuncionario);

router.get('/anio/:id_anio_legal', posicionCargoController.getAllByAnio);

// =============================================
// RUTAS ESPECÍFICAS
// =============================================

// Por departamento
router.get('/anio/:id_anio_legal/departamento/:id_departamento', posicionCargoController.getByDepartamento);

// Por cargo
router.get('/anio/:id_anio_legal/cargo/:id_cargo_base', posicionCargoController.getByCargo);

// Por estado
router.get('/anio/:id_anio_legal/estado/:estado', posicionCargoController.getByEstado);

// Copiar posiciones de un año a otro
router.post('/copy/:id_anio_origen/:id_anio_destino', posicionCargoController.copyFromYear);


router.post('/:id/asignar-funcionario', posicionCargoController.asignarFuncionario);


module.exports = router;
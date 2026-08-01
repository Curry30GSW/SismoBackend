const express = require('express');
const router = express.Router();
const firmanteController = require('../../controllers/contratos/firmanteController');

router.get('/', firmanteController.listar);
router.get('/actual/:tipo', firmanteController.obtenerActivo);
router.post('/', firmanteController.crear);
router.put('/:id', firmanteController.actualizar);
router.post('/:id/activar', firmanteController.activar);
router.delete('/:id', firmanteController.eliminar);

module.exports = router;
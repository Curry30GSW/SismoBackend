const express = require('express');
const router = express.Router();
const funcionarioController = require('../../controllers/plantaCargos/funcionarioController');



router.get('/documento/:tipo/:numero', funcionarioController.getByDocumento);


router.get('/', funcionarioController.getAll);
router.post('/', funcionarioController.create);
router.get('/:id', funcionarioController.getById);
router.get('/:id/historial', funcionarioController.getHistorialPosiciones);
router.put('/:id/retire', funcionarioController.retire);
router.put('/:id/transfer', funcionarioController.transfer);
router.patch('/:id/deactivate', funcionarioController.deactivate);
module.exports = router;
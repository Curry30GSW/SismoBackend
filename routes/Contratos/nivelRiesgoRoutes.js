const express = require('express');
const router = express.Router();
const nivelRiesgoController = require('../../controllers/Contratos/nivelRiesgoController');

router.post('/', nivelRiesgoController.create);
router.get('/', nivelRiesgoController.getAll);
router.get('/arl/:id_arl', nivelRiesgoController.getByArl);
router.get('/:id', nivelRiesgoController.getById);
router.put('/:id', nivelRiesgoController.update);
router.delete('/:id', nivelRiesgoController.delete);

module.exports = router;
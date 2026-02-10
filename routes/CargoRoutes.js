const express = require('express');
const router = express.Router();
const CargoController = require('../controllers/CargoController');

router.post('/create-cargo', CargoController.create);
router.get('/cargos', CargoController.getAll);
router.get('/cargo/:id', CargoController.getById);
router.put('/update-cargo/:id', CargoController.update);
router.delete('/delete-cargo/:id', CargoController.delete);

module.exports = router;

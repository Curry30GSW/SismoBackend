const express = require('express');
const router = express.Router();
const funcionarioController = require('../../controllers/plantaCargos/funcionarioController');
const { authMiddleware } = require('../../middlewares/authMiddleware');


router.get('/documento/:tipo/:numero', authMiddleware, funcionarioController.getByDocumento);


router.get('/', authMiddleware, funcionarioController.getAll);
router.get('/activos', authMiddleware, funcionarioController.getAllActivosOnlyFuncionarios);
router.post('/', authMiddleware, funcionarioController.create);
router.get('/:id', authMiddleware, funcionarioController.getById);
router.get('/:id/historial', authMiddleware, funcionarioController.getHistorialPosiciones);
router.put('/:id/retire', authMiddleware, funcionarioController.retire);
router.put('/:id/transfer', authMiddleware, funcionarioController.transfer);
router.patch('/:id/deactivate', authMiddleware, funcionarioController.deactivate);
module.exports = router;
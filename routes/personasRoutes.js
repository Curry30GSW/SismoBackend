const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const personaController = require('../controllers/personaController');

router.post('/', upload.single('foto'), personaController.crear);
router.get('/', personaController.listar);

// OJO con el orden: rutas específicas antes de /:id
router.get('/cedula/:cedula', personaController.obtenerPorCedula);
router.get('/:id', personaController.obtener);

router.put('/:id', upload.single('foto'), personaController.actualizar);
router.delete('/:id', personaController.eliminar);

module.exports = router;
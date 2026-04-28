const express = require('express');
const router = express.Router();

const { obtenerAsociacionesNetas } = require('../../controllers/plantaCargos/asociacionesController');

router.get('/', obtenerAsociacionesNetas);

module.exports = router;
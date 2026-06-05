const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middlewares/authMiddleware');

const { obtenerAsociacionesNetas } = require('../../controllers/plantaCargos/asociacionesController');

router.get('/', authMiddleware, obtenerAsociacionesNetas);

module.exports = router;
const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');

router.post('/hire', funcionarioController.hire);
router.put('/:id/retire', funcionarioController.retire);
router.put('/:id/transfer', funcionarioController.transfer);

module.exports = router;
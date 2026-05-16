const express = require('express');
const router = express.Router();

const salidasController = require('../controllers/salidasController');

const verificarGafete = require('../middlewares/authMiddleware');

router.post('/', verificarGafete, salidasController.registroSalidas);

router.get('/historial', verificarGafete, salidasController.listarSalidas);

router.put('/:id/recibir', verificarGafete, salidasController.recibirSalida);

router.post('/simular', verificarGafete, salidasController.simularSalida);

module.exports = router; 
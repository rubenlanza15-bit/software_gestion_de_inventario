require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const rutasProductos = require('./src/routes/productos');

const app = express();

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, 'frontend')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/api/estado', (req, res) => {
    res.json({ mensaje: 'El motor del backend esta funcionand!' });
});

app.use('/api/productos', rutasProductos);

const rutasAuth = require('./src/routes/auth');
app.use('/api/auth', rutasAuth);

const rutasSalidas = require('./src/routes/salidas');
app.use('/api/salidas', rutasSalidas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);

});

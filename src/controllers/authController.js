const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const login = async (req, res) => {

    const { correo, password } = req.body;

    const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correo);

    if (error || usuarios.length === 0) {
        return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    const usuarioEncontrado = usuarios[0];

    if (password !== usuarioEncontrado.password) {
        return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    const gafeteVIP = jwt.sign(
        { id: usuarioEncontrado.id, rol: usuarioEncontrado.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        mensaje: 'Bienvenido ' + usuarioEncontrado.rol,
        token: gafeteVIP,
        usuario: usuarioEncontrado.nombre,
        rol: usuarioEncontrado.rol
    });
};

module.exports = { login };
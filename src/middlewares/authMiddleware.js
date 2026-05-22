const jwt = require('jsonwebtoken');
const verificarGafete = (req, res, next) => {
    const gafete = req.header('Authorization');
    if (!gafete) {
        return res.status(401).json({ error: 'Acceso denegado. No tienes gafete VIP.' });
    }


    try {
        const gafeteVerificado = jwt.verify(gafete, process.env.JWT_SECRET);

        req.usuario = gafeteVerificado;
        next();

    } catch (error) {
        return res.status(401).json({ error: 'Gafete invalido o vencido.' });
    }
};
module.exports = verificarGafete;
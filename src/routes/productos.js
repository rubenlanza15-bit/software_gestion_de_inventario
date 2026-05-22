const express = require('express');

const router = express.Router();

const supabase = require('../config/supabase');
const verificarGafete = require('../middlewares/authMiddleware');

router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('productos_unicos_con_stock').select('*');
    if (error) { return res.status(500).json({ error: error.message }); }
    res.json(data);
});

router.post('/', verificarGafete, async (req, res) => {
    if (req.usuario.rol !== 'Jefe de Bodega') {
        return res.status(403).json({ error: 'Solo el Jefe de Bodega puede registrar nuevos medicamentos.' });
    }

    const { nombre, descripcion, lote } = req.body;
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre del medicamento es requerido.' });
    }

    // 1. Insert product
    const { data: nuevoProducto, error: errorProducto } = await supabase
        .from('productos')
        .insert([{ nombre, descripcion }])
        .select();

    if (errorProducto) {
        return res.status(500).json({ error: 'Error al registrar el medicamento: ' + errorProducto.message });
    }

    const productoCreado = nuevoProducto[0];

    // 2. Insert initial batch if provided
    if (lote && lote.cantidad_disponible > 0) {
        const { error: errorLote } = await supabase
            .from('lotes')
            .insert([{
                producto_id: productoCreado.id,
                cantidad_disponible: parseInt(lote.cantidad_disponible),
                costo_unitario: parseFloat(lote.costo_unitario),
                fecha_vencimiento: lote.fecha_vencimiento
            }]);

        if (errorLote) {
            return res.status(500).json({ 
                error: 'Medicamento creado, pero hubo un error al registrar el lote inicial: ' + errorLote.message,
                producto: productoCreado
            });
        }
    }

    return res.status(201).json({
        mensaje: '¡Medicamento registrado con éxito!',
        producto: productoCreado
    });
});

module.exports = router;
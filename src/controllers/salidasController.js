const supabase = require('../config/supabase');

const registroSalidas = async (req, res) => {
    if (req.usuario.rol !== 'Jefe de Bodega') {
        return res.status(403).json({ error: 'Solo el Jefe de Bodega puede realizar salidas.' });
    }
    const { sucursal_id, productos } = req.body;

    const usuario_envia_id = req.usuario.id;

    // REGLA 1: LIMITE DE CREDITO L 5000

    const { data: salidasPendientes, error: errorPendientes } = await supabase
        .from('salidas')
        .select('costo_total')
        .eq('sucursal_id', sucursal_id)
        .eq('estado', 'Enviada a sucursal');

    if (errorPendientes) return res.status(500).json({ error: 'Error al verificar la deuda' });

    let totalPendiente = 0;
    for (let i = 0; i < salidasPendientes.length; i++) {
        totalPendiente += Number(salidasPendientes[i].costo_total);
    }
    if (totalPendiente > 5000) {
        return res.status(400).json({ error: 'Limite excedido. La sucursal debe L ' + totalPendiente });
    }


    // REGLA 2: LOGICA FIFO Y VALIDACION DE INVENTARIO



    const { data: nuevaSalida, error: errorSalida } = await supabase
        .from('salidas')
        .insert([{
            sucursal_id: sucursal_id,
            usuario_envia_id: usuario_envia_id,
            costo_total: 0
        }])
        .select();

    if (errorSalida) return res.status(500).json({ error: 'Error al crear la salida' + errorSalida.message });
    const salidaId = nuevaSalida[0].id;
    let costoTotalDelViaje = 0;


    for (const prod of productos) {
        let cantidadFaltante = prod.cantidad;


        const { data: lotes } = await supabase
            .from('lotes')
            .select('*')
            .eq('producto_id', prod.id)
            .gt('cantidad_disponible', 0)
            .order('fecha_vencimiento', { ascending: true });


        const inventarioTotal = lotes.reduce((sum, lote) => sum + lote.cantidad_disponible, 0);
        if (inventarioTotal < cantidadFaltante) {

            await supabase.from('salidas').delete().eq('id', salidaId);
            return res.status(400).json({ error: 'No hay inventario suficiente para el producto ID ' + prod.id });
        }


        for (const lote of lotes) {
            if (cantidadFaltante === 0) break;


            const cantidadATomar = Math.min(cantidadFaltante, lote.cantidad_disponible);


            await supabase.from('detalles_salida').insert([{
                salida_id: salidaId,
                producto_id: prod.id,
                lote_id: lote.id,
                cantidad: cantidadATomar,
                costo_unitario: lote.costo_unitario
            }]);


            const nuevaCantidadLote = lote.cantidad_disponible - cantidadATomar;
            await supabase.from('lotes').update({ cantidad_disponible: nuevaCantidadLote }).eq('id', lote.id);


            costoTotalDelViaje += (cantidadATomar * lote.costo_unitario);


            cantidadFaltante -= cantidadATomar;
        }
    }


    await supabase.from('salidas').update({ costo_total: costoTotalDelViaje }).eq('id', salidaId);

    return res.json({ mensaje: '¡Salida registrada con exito!', salida_id: salidaId, costo_total: costoTotalDelViaje });


}



const simularSalida = async (req, res) => {
    if (req.usuario.rol !== 'Jefe de Bodega') {
        return res.status(403).json({ error: 'Solo el Jefe de Bodega puede simular salidas.' });
    }
    const { productos } = req.body;
    let gridFinal = [];
    let costoTotalDelViaje = 0;

    for (const prod of productos) {
        let cantidadFaltante = prod.cantidad;

        const { data: lotes } = await supabase
            .from('lotes')
            .select('*')
            .eq('producto_id', prod.id)
            .gt('cantidad_disponible', 0)
            .order('fecha_vencimiento', { ascending: true });

        const inventarioTotal = lotes.reduce((sum, lote) => sum + lote.cantidad_disponible, 0);
        if (inventarioTotal < cantidadFaltante) {
            return res.status(400).json({ error: 'No hay inventario suficiente para ' + prod.nombre });
        }

        for (const lote of lotes) {
            if (cantidadFaltante === 0) break;
            const cantidadATomar = Math.min(cantidadFaltante, lote.cantidad_disponible);

            gridFinal.push({
                producto_id: prod.id,
                nombre: prod.nombre,
                cantidad: cantidadATomar,
                lote_id: lote.id,
                costo_unitario: lote.costo_unitario,
                costo_subtotal: cantidadATomar * lote.costo_unitario,
                fecha_vencimiento: lote.fecha_vencimiento
            });

            costoTotalDelViaje += (cantidadATomar * lote.costo_unitario);
            cantidadFaltante -= cantidadATomar;
        }
    }
    return res.json({ grid: gridFinal, costo_total: costoTotalDelViaje });
};

// 3. LISTADO DE SALIDAS (CON FILTROS)
const listarSalidas = async (req, res) => {
    const { sucursal_id, fecha_inicio, fecha_fin } = req.query;

    let consulta = supabase
        .from('salidas')
        .select(`
            id, 
            costo_total, 
            estado, 
            fecha_envio, 
            fecha_recibido, 
            sucursales ( nombre ), 
            usuarios!salidas_usuario_envia_id_fkey ( nombre ),
            usuarios_recibe:usuarios!salidas_usuario_recibe_id_fkey ( nombre ),
            detalles_salida ( cantidad, productos ( nombre ) )
        `);


    if (sucursal_id && sucursal_id !== 'todas') {
        consulta = consulta.eq('sucursal_id', sucursal_id);
    }
    if (fecha_inicio) {
        consulta = consulta.gte('fecha_envio', fecha_inicio + 'T00:00:00Z');
    }
    if (fecha_fin) {
        consulta = consulta.lte('fecha_envio', fecha_fin + 'T23:59:59Z');
    }

    // 4. Ejecutamos la búsqueda en Supabase
    const { data: listado, error } = await consulta;

    if (error) {
        return res.status(500).json({ error: 'Error real de Supabase: ' + error.message, detalles: error });
    }
    return res.json({ salidas: listado });
};

const recibirSalida = async (req, res) => {
    if (req.usuario.rol !== 'Jefe de Bodega') {
        return res.status(403).json({ error: 'Solo el Jefe de Bodega puede recibir salidas.' });
    }
    const idSalidaViaje = req.params.id;
    const empleadoRecibeId = req.usuario.id;

    const { data, error } = await supabase
        .from('salidas')
        .update({
            estado: 'Recibido en Sucursal',
            usuario_recibe_id: empleadoRecibeId,
            fecha_recibido: new Date().toISOString()
        })
        .eq('id', idSalidaViaje)
        .select();

    if (error) {
        return res.status(500).json({ error: 'Error al marcar como recibido: ' + error.message, detalles: error });
    }
    return res.json({ mensaje: '¡Mercancia Recibida exitosamente!', salida: data[0] });
}

module.exports = { registroSalidas, listarSalidas, recibirSalida, simularSalida }; 
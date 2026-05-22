const express = require('express');

const router = express.Router();

const supabase = require('../config/supabase');

router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('productos_unicos_con_stock').select('*');
    if (error) { return res.status(500).json({ error: error.message }); }
    res.json(data);
});

module.exports = router;
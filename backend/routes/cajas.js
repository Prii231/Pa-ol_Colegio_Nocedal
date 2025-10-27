// routes/cajas.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Listar todas las cajas
    router.get('/', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    c.CAJ_CODIGO,
                    c.CAJ_NUMERO,
                    c.CAJ_ESTADO,
                    c.CAJ_COMPLETITUD,
                    c.CAJ_OBSERVACIONES,
                    t.TAL_CODIGO,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM CAJA c
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 ORDER BY t.TAL_NOMBRE, c.CAJ_NUMERO`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo cajas:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Cajas disponibles por taller
    router.get('/disponibles', async (req, res) => {
        let connection;
        try {
            const { taller } = req.query;
            connection = await pool.getConnection();
            
            let query = `SELECT 
                    c.CAJ_CODIGO,
                    c.CAJ_NUMERO,
                    c.CAJ_COMPLETITUD,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM CAJA c
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE c.CAJ_ESTADO = 'DISPONIBLE'`;
            
            const binds = {};
            
            if (taller) {
                query += ` AND c.TAL_CODIGO = :taller`;
                binds.taller = taller;
            }
            
            query += ` ORDER BY c.CAJ_NUMERO`;
            
            const result = await connection.execute(query, binds);
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo cajas disponibles:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Contenido de una caja
    router.get('/:codigo/contenido', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    ic.IEC_ID,
                    ic.INV_ID,
                    ii.ITM_CODIGO,
                    i.ITM_NOMBRE,
                    i.ITM_DESCRIPCION,
                    ii.INV_ESTADO,
                    ii.INV_CONDICION
                 FROM ITEMS_EN_CAJAS ic
                 INNER JOIN INV_ITEMS ii ON ic.INV_ID = ii.INV_ID
                 INNER JOIN ITM i ON ii.ITM_CODIGO = i.ITM_CODIGO
                 WHERE ic.CAJ_CODIGO = :codigo
                 ORDER BY i.ITM_NOMBRE`,
                { codigo }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo contenido de caja:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Verificar si una caja está disponible (usa función PL/SQL)
    router.get('/:codigo/disponible', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT pkg_gestion_prestamos.fn_caja_disponible(:cajaCodigo) AS DISPONIBLE FROM DUAL`,
                { cajaCodigo: codigo }
            );

            const disponible = result.rows[0].DISPONIBLE === 1;
            res.json({ disponible: disponible });

        } catch (err) {
            console.error("Error verificando disponibilidad:", err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Historial de una caja
    router.get('/:codigo/historial', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    p.PRE_ID,
                    p.PRE_FECHA_INICIO,
                    p.PRE_FECHA_FIN,
                    p.PRE_ESTADO,
                    g.GRU_NOMBRE,
                    d.DOC_NOMBRE || ' ' || d.DOC_APELLIDO AS DOCENTE_NOMBRE
                 FROM PRESTAMO p
                 INNER JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 LEFT JOIN DOCENTE d ON p.DOC_RUT = d.DOC_RUT
                 WHERE p.CAJ_CODIGO = :codigo
                 ORDER BY p.PRE_FECHA_INICIO DESC`,
                { codigo }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo historial:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
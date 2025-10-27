// routes/revision.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Obtener información para revisión de un préstamo
    router.get('/:prestamo_id', async (req, res) => {
        let connection;
        try {
            const { prestamo_id } = req.params;
            connection = await pool.getConnection();
            
            // Obtener información del préstamo
            const prestamo = await connection.execute(
                `SELECT 
                    p.*,
                    c.CAJ_NUMERO,
                    g.GRU_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    d.DOC_NOMBRE || ' ' || d.DOC_APELLIDO AS DOCENTE_NOMBRE
                 FROM PRESTAMO p
                 INNER JOIN CAJA c ON p.CAJ_CODIGO = c.CAJ_CODIGO
                 INNER JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 LEFT JOIN DOCENTE d ON p.DOC_RUT = d.DOC_RUT
                 WHERE p.PRE_ID = :prestamo_id`,
                { prestamo_id }
            );
            
            if (prestamo.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Préstamo no encontrado' 
                });
            }
            
            // Obtener items de la caja
            const items = await connection.execute(
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
                 WHERE ic.CAJ_CODIGO = :caj_codigo
                 ORDER BY i.ITM_NOMBRE`,
                { caj_codigo: prestamo.rows[0].CAJ_CODIGO }
            );
            
            res.json({
                prestamo: prestamo.rows[0],
                items: items.rows
            });
            
        } catch (err) {
            console.error('Error obteniendo información de revisión:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Guardar borrador de revisión (opcional, guardar en localStorage desde frontend)
    // Esta ruta puede omitirse si usas solo localStorage en el frontend
    
    return router;
};
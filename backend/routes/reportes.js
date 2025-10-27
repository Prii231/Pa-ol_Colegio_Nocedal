// routes/reportes.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Reporte de préstamos activos
    router.get('/prestamos', async (req, res) => {
        let connection;
        try {
            const { taller, fecha_inicio, fecha_fin } = req.query;
            connection = await pool.getConnection();
            
            let query = `SELECT 
                    p.PRE_ID,
                    p.PRE_FECHA_INICIO,
                    p.PRE_FECHA_FIN,
                    p.PRE_ESTADO,
                    c.CAJ_CODIGO,
                    c.CAJ_NUMERO,
                    g.GRU_NOMBRE,
                    cu.CUR_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    d.DOC_NOMBRE || ' ' || d.DOC_APELLIDO AS DOCENTE_NOMBRE
                 FROM PRESTAMO p
                 INNER JOIN CAJA c ON p.CAJ_CODIGO = c.CAJ_CODIGO
                 INNER JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 INNER JOIN CURSO cu ON g.CUR_CODIGO = cu.CUR_CODIGO
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 LEFT JOIN DOCENTE d ON p.DOC_RUT = d.DOC_RUT
                 WHERE 1=1`;
            
            const binds = {};
            
            if (taller) {
                query += ` AND t.TAL_CODIGO = :taller`;
                binds.taller = taller;
            }
            
            if (fecha_inicio) {
                query += ` AND p.PRE_FECHA_INICIO >= TO_DATE(:fecha_inicio, 'YYYY-MM-DD')`;
                binds.fecha_inicio = fecha_inicio;
            }
            
            if (fecha_fin) {
                query += ` AND p.PRE_FECHA_INICIO <= TO_DATE(:fecha_fin, 'YYYY-MM-DD')`;
                binds.fecha_fin = fecha_fin;
            }
            
            query += ` ORDER BY p.PRE_FECHA_INICIO DESC`;
            
            const result = await connection.execute(query, binds);
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error generando reporte de préstamos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Reporte de inventario
    router.get('/inventario', async (req, res) => {
        let connection;
        try {
            const { taller } = req.query;
            connection = await pool.getConnection();
            
            let query = `SELECT 
                    i.ITM_CODIGO,
                    i.ITM_NOMBRE,
                    i.ITM_CATEGORIA,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    COUNT(ii.INV_ID) AS TOTAL_UNIDADES,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'DISPONIBLE' THEN 1 END) AS DISPONIBLES,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'ASIGNADO' THEN 1 END) AS ASIGNADOS,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'EXTRAVIADO' THEN 1 END) AS EXTRAVIADOS,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'MANTENIMIENTO' THEN 1 END) AS EN_MANTENIMIENTO
                 FROM ITM i
                 LEFT JOIN INV_ITEMS ii ON i.ITM_CODIGO = ii.ITM_CODIGO
                 LEFT JOIN TALLER t ON i.TAL_CODIGO = t.TAL_CODIGO
                 WHERE 1=1`;
            
            const binds = {};
            
            if (taller) {
                query += ` AND i.TAL_CODIGO = :taller`;
                binds.taller = taller;
            }
            
            query += ` GROUP BY i.ITM_CODIGO, i.ITM_NOMBRE, i.ITM_CATEGORIA, t.TAL_NOMBRE
                       ORDER BY t.TAL_NOMBRE, i.ITM_NOMBRE`;
            
            const result = await connection.execute(query, binds);
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error generando reporte de inventario:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Reporte de items problemáticos
    router.get('/items-problematicos', async (req, res) => {
        let connection;
        try {
            const { taller, fecha_inicio, fecha_fin } = req.query;
            connection = await pool.getConnection();
            
            let query = `SELECT 
                    ip.IPR_ID,
                    ip.IPR_FECHA_REPORTE,
                    ip.IPR_DESCRIPCION,
                    ip.IPR_TIPO_PROBLEMA,
                    ip.IPR_ESTADO,
                    i.ITM_NOMBRE,
                    p.PRE_ID,
                    g.GRU_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM ITEMS_PROBLEMATICOS ip
                 INNER JOIN INV_ITEMS ii ON ip.INV_ID = ii.INV_ID
                 INNER JOIN ITM i ON ii.ITM_CODIGO = i.ITM_CODIGO
                 LEFT JOIN PRESTAMO p ON ip.PRE_ID = p.PRE_ID
                 LEFT JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 LEFT JOIN TALLER t ON i.TAL_CODIGO = t.TAL_CODIGO
                 WHERE 1=1`;
            
            const binds = {};
            
            if (taller) {
                query += ` AND t.TAL_CODIGO = :taller`;
                binds.taller = taller;
            }
            
            if (fecha_inicio) {
                query += ` AND ip.IPR_FECHA_REPORTE >= TO_DATE(:fecha_inicio, 'YYYY-MM-DD')`;
                binds.fecha_inicio = fecha_inicio;
            }
            
            if (fecha_fin) {
                query += ` AND ip.IPR_FECHA_REPORTE <= TO_DATE(:fecha_fin, 'YYYY-MM-DD')`;
                binds.fecha_fin = fecha_fin;
            }
            
            query += ` ORDER BY ip.IPR_FECHA_REPORTE DESC`;
            
            const result = await connection.execute(query, binds);
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error generando reporte de items problemáticos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Estadísticas por taller (usa stored procedure)
    router.get('/estadisticas', async (req, res) => {
        let connection;
        try {
            const { taller } = req.query;
            connection = await pool.getConnection();
            
            // Estadísticas generales
            const result = await connection.execute(
                `SELECT 
                    t.TAL_NOMBRE,
                    COUNT(DISTINCT c.CAJ_CODIGO) AS TOTAL_CAJAS,
                    COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'DISPONIBLE' THEN c.CAJ_CODIGO END) AS CAJAS_DISPONIBLES,
                    COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'PRESTADA' THEN c.CAJ_CODIGO END) AS CAJAS_PRESTADAS,
                    COUNT(DISTINCT i.ITM_CODIGO) AS TOTAL_ITEMS,
                    COUNT(ii.INV_ID) AS TOTAL_UNIDADES,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'EXTRAVIADO' THEN 1 END) AS ITEMS_EXTRAVIADOS
                 FROM TALLER t
                 LEFT JOIN CAJA c ON t.TAL_CODIGO = c.TAL_CODIGO
                 LEFT JOIN ITM i ON t.TAL_CODIGO = i.TAL_CODIGO
                 LEFT JOIN INV_ITEMS ii ON i.ITM_CODIGO = ii.ITM_CODIGO
                 WHERE t.TAL_CODIGO = :taller
                 GROUP BY t.TAL_NOMBRE`,
                { taller: taller }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Taller no encontrado' });
            }
            
        } catch (err) {
            console.error('Error generando estadísticas:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Historial de movimientos
    router.get('/historial', async (req, res) => {
        let connection;
        try {
            const { taller, fecha_inicio, fecha_fin } = req.query;
            connection = await pool.getConnection();
            
            let query = `SELECT 
                    h.HIS_ID,
                    h.HIS_FECHA,
                    h.HIS_TIPO_MOVIMIENTO,
                    h.HIS_OBSERVACIONES,
                    i.ITM_NOMBRE,
                    a.ALU_NOMBRES || ' ' || a.ALU_APELLIDOS AS ALUMNO_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM HISTORIAL_MOVIMIENTOS h
                 LEFT JOIN INV_ITEMS ii ON h.INV_ID = ii.INV_ID
                 LEFT JOIN ITM i ON ii.ITM_CODIGO = i.ITM_CODIGO
                 LEFT JOIN ALUMNO a ON h.ALU_RUT = a.ALU_RUT
                 LEFT JOIN TALLER t ON i.TAL_CODIGO = t.TAL_CODIGO
                 WHERE 1=1`;
            
            const binds = {};
            
            if (taller) {
                query += ` AND t.TAL_CODIGO = :taller`;
                binds.taller = taller;
            }
            
            if (fecha_inicio) {
                query += ` AND h.HIS_FECHA >= TO_DATE(:fecha_inicio, 'YYYY-MM-DD')`;
                binds.fecha_inicio = fecha_inicio;
            }
            
            if (fecha_fin) {
                query += ` AND h.HIS_FECHA <= TO_DATE(:fecha_fin, 'YYYY-MM-DD')`;
                binds.fecha_fin = fecha_fin;
            }
            
            query += ` ORDER BY h.HIS_FECHA DESC`;
            
            const result = await connection.execute(query, binds);
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error generando historial:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
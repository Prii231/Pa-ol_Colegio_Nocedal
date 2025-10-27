// backend/routes/dashboard.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // Obtener métricas principales del dashboard
    router.get('/metricas', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            // Total de cajas
            const totalCajas = await connection.execute(
                `SELECT COUNT(*) AS TOTAL FROM CAJA`
            );
            
            // Préstamos activos
            const prestamosActivos = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM PRESTAMO 
                 WHERE PRE_ESTADO = 'ACTIVO'`
            );
            
            // Items extraviados
            const itemsExtraviados = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM INV_ITEMS 
                 WHERE INV_ESTADO = 'EXTRAVIADO'`
            );
            
            // Cajas disponibles
            const cajasDisponibles = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM CAJA 
                 WHERE CAJ_ESTADO = 'DISPONIBLE'`
            );
            
            res.json({
                totalCajas: totalCajas.rows[0].TOTAL,
                prestamosActivos: prestamosActivos.rows[0].TOTAL,
                itemsExtraviados: itemsExtraviados.rows[0].TOTAL,
                cajasDisponibles: cajasDisponibles.rows[0].TOTAL
            });
            
        } catch (err) {
            console.error('Error obteniendo métricas:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // Obtener resumen por taller
    router.get('/resumen-talleres', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    t.TAL_NOMBRE,
                    t.TAL_UBICACION,
                    COUNT(DISTINCT c.CAJ_CODIGO) AS TOTAL_CAJAS,
                    COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'PRESTADA' THEN c.CAJ_CODIGO END) AS CAJAS_PRESTADAS,
                    COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'DISPONIBLE' THEN c.CAJ_CODIGO END) AS CAJAS_DISPONIBLES,
                    ROUND(
                        (COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'PRESTADA' THEN c.CAJ_CODIGO END) / 
                        NULLIF(COUNT(DISTINCT c.CAJ_CODIGO), 0)) * 100, 
                        0
                    ) AS PORCENTAJE_USO
                 FROM TALLER t
                 LEFT JOIN CAJA c ON t.TAL_CODIGO = c.TAL_CODIGO
                 GROUP BY t.TAL_NOMBRE, t.TAL_UBICACION
                 ORDER BY t.TAL_NOMBRE`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo resumen de talleres:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // Obtener préstamos recientes
    router.get('/prestamos-recientes', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    p.PRE_ID,
                    p.PRE_FECHA_INICIO,
                    g.GRU_NOMBRE || ' - ' || cu.CUR_NOMBRE AS GRUPO,
                    c.CAJ_CODIGO,
                    t.TAL_NOMBRE,
                    p.PRE_ESTADO
                 FROM PRESTAMO p
                 INNER JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 INNER JOIN CURSO cu ON g.CUR_CODIGO = cu.CUR_CODIGO
                 INNER JOIN CAJA c ON p.CAJ_CODIGO = c.CAJ_CODIGO
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE ROWNUM <= 5
                 ORDER BY p.PRE_FECHA_INICIO DESC`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo préstamos recientes:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // Obtener alertas del sistema
    router.get('/alertas', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const alertas = [];
            
            // Items extraviados
            const itemsExtraviados = await connection.execute(
                `SELECT COUNT(*) AS TOTAL FROM INV_ITEMS WHERE INV_ESTADO = 'EXTRAVIADO'`
            );
            if (itemsExtraviados.rows[0].TOTAL > 0) {
                alertas.push({
                    tipo: 'warning',
                    mensaje: `${itemsExtraviados.rows[0].TOTAL} items extraviados requieren gestión de reposición`
                });
            }
            
            // Talleres sin cajas disponibles
            const tallersSinCajas = await connection.execute(
                `SELECT t.TAL_NOMBRE
                 FROM TALLER t
                 WHERE NOT EXISTS (
                     SELECT 1 FROM CAJA c 
                     WHERE c.TAL_CODIGO = t.TAL_CODIGO 
                     AND c.CAJ_ESTADO = 'DISPONIBLE'
                 )`
            );
            tallersSinCajas.rows.forEach(row => {
                alertas.push({
                    tipo: 'danger',
                    mensaje: `${row.TAL_NOMBRE} tiene todas sus cajas en préstamo`
                });
            });
            
            // Cajas con items faltantes
            const cajasIncompletas = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM CAJA 
                 WHERE CAJ_COMPLETITUD < 100 
                 AND CAJ_ESTADO = 'DISPONIBLE'`
            );
            if (cajasIncompletas.rows[0].TOTAL > 0) {
                alertas.push({
                    tipo: 'warning',
                    mensaje: `${cajasIncompletas.rows[0].TOTAL} cajas requieren revisión de inventario`
                });
            }
            
            res.json(alertas);
            
        } catch (err) {
            console.error('Error obteniendo alertas:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
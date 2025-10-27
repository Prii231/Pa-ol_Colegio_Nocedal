// routes/dashboard.js - CORREGIDO CON NOMBRES REALES DE TABLAS

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Métricas principales del dashboard
    router.get('/metricas', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('📊 Obteniendo métricas del dashboard...');
            
            // Total de cajas
            const totalCajas = await connection.execute(
                `SELECT COUNT(*) AS TOTAL FROM CAJAS_HERRAMIENTAS`
            );
            
            // Préstamos activos
            const prestamosActivos = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM PRESTAMOS_ANUALES 
                 WHERE PRE_ESTADO = 'ACTIVO'`
            );
            
            // Items extraviados
            const itemsExtraviados = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM INVENTARIO_ITEMS 
                 WHERE INV_ESTADO = 'EXTRAVIADO'`
            );
            
            // Cajas disponibles
            const cajasDisponibles = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM CAJAS_HERRAMIENTAS 
                 WHERE CAJ_ESTADO = 'DISPONIBLE'`
            );
            
            const metricas = {
                totalCajas: totalCajas.rows[0].TOTAL || 0,
                prestamosActivos: prestamosActivos.rows[0].TOTAL || 0,
                itemsExtraviados: itemsExtraviados.rows[0].TOTAL || 0,
                cajasDisponibles: cajasDisponibles.rows[0].TOTAL || 0
            };
            
            console.log('✅ Métricas obtenidas:', metricas);
            res.json(metricas);
            
        } catch (err) {
            console.error('❌ Error obteniendo métricas:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message,
                details: 'Verifica que existan las tablas: CAJAS_HERRAMIENTAS, PRESTAMOS_ANUALES, INVENTARIO_ITEMS'
            });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Resumen por talleres
    router.get('/resumen-talleres', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('📊 Obteniendo resumen de talleres...');
            
            const result = await connection.execute(
                `SELECT 
                    t.TAL_CODIGO,
                    t.TAL_NOMBRE,
                    COUNT(DISTINCT c.CAJ_CODIGO) AS TOTAL_CAJAS,
                    COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'DISPONIBLE' THEN c.CAJ_CODIGO END) AS CAJAS_DISPONIBLES,
                    COUNT(DISTINCT CASE WHEN c.CAJ_ESTADO = 'PRESTADA' THEN c.CAJ_CODIGO END) AS CAJAS_PRESTADAS
                 FROM TALLERES t
                 LEFT JOIN CAJAS_HERRAMIENTAS c ON t.TAL_CODIGO = c.TAL_CODIGO
                 GROUP BY t.TAL_CODIGO, t.TAL_NOMBRE
                 ORDER BY t.TAL_NOMBRE`
            );
            
            console.log('✅ Talleres encontrados:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo resumen de talleres:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message,
                details: 'Verifica las tablas: TALLERES, CAJAS_HERRAMIENTAS'
            });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Préstamos recientes
    router.get('/prestamos-recientes', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('📊 Obteniendo préstamos recientes...');
            
            const result = await connection.execute(
                `SELECT 
                    p.PRE_ID,
                    p.PRE_FECHA_INICIO,
                    p.PRE_ESTADO,
                    p.CAJ_CODIGO,
                    c.CAJ_NUMERO,
                    g.GRU_NOMBRE AS GRUPO_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    d.DOC_NOMBRES || ' ' || d.DOC_APELLIDOS AS DOCENTE_NOMBRE
                 FROM PRESTAMOS_ANUALES p
                 INNER JOIN CAJAS_HERRAMIENTAS c ON p.CAJ_CODIGO = c.CAJ_CODIGO
                 INNER JOIN GRUPOS_TRABAJO g ON p.GRU_ID = g.GRU_ID
                 INNER JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 LEFT JOIN DOCENTES d ON p.DOC_RUT_AUTORIZA = d.DOC_RUT
                 WHERE ROWNUM <= 10
                 ORDER BY p.PRE_FECHA_INICIO DESC`
            );
            
            console.log('✅ Préstamos recientes encontrados:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo préstamos recientes:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message,
                details: 'Verifica las tablas: PRESTAMOS_ANUALES, CAJAS_HERRAMIENTAS, GRUPOS_TRABAJO, TALLERES, DOCENTES'
            });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Alertas (items problemáticos recientes)
    router.get('/alertas', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('📊 Obteniendo alertas...');
            
            // Consulta con nombres correctos: PRO_ en lugar de IPR_
            const result = await connection.execute(
                `SELECT 
                    ip.PRO_ID,
                    ip.PRO_FECHA_REPORTE,
                    ip.PRO_DESCRIPCION,
                    ip.PRO_TIPO_PROBLEMA,
                    i.ITM_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM ITEMS_PROBLEMATICOS ip
                 INNER JOIN INVENTARIO_ITEMS ii ON ip.INV_ID = ii.INV_ID
                 INNER JOIN ITEMS i ON ii.ITM_CODIGO = i.ITM_CODIGO
                 LEFT JOIN TALLERES t ON i.TAL_CODIGO = t.TAL_CODIGO
                 WHERE ip.PRO_ESTADO_RESOLUCION = 'PENDIENTE'
                 AND ROWNUM <= 5
                 ORDER BY ip.PRO_FECHA_REPORTE DESC`
            );
            
            console.log('✅ Alertas encontradas:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo alertas:', err.message);
            
            // Si hay error, retornar array vacío
            if (err.message.includes('ORA-00942')) {
                console.log('⚠️  Tabla ITEMS_PROBLEMATICOS no existe, retornando array vacío');
            }
            res.json([]);
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Estadísticas generales
    router.get('/estadisticas', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('📊 Obteniendo estadísticas generales...');
            
            // Total de alumnos activos
            const totalAlumnos = await connection.execute(
                `SELECT COUNT(*) AS TOTAL 
                 FROM ALUMNOS 
                 WHERE ALU_ESTADO = 'ACTIVO'`
            );
            
            // Total de grupos
            const totalGrupos = await connection.execute(
                `SELECT COUNT(*) AS TOTAL FROM GRUPOS_TRABAJO`
            );
            
            // Total de items
            const totalItems = await connection.execute(
                `SELECT COUNT(*) AS TOTAL FROM INVENTARIO_ITEMS`
            );
            
            // Tasa de disponibilidad de cajas
            const tasaDisponibilidad = await connection.execute(
                `SELECT 
                    ROUND((COUNT(CASE WHEN CAJ_ESTADO = 'DISPONIBLE' THEN 1 END) / COUNT(*)) * 100, 2) AS PORCENTAJE
                 FROM CAJAS_HERRAMIENTAS`
            );
            
            const estadisticas = {
                totalAlumnos: totalAlumnos.rows[0].TOTAL || 0,
                totalGrupos: totalGrupos.rows[0].TOTAL || 0,
                totalItems: totalItems.rows[0].TOTAL || 0,
                tasaDisponibilidad: tasaDisponibilidad.rows[0].PORCENTAJE || 0
            };
            
            console.log('✅ Estadísticas obtenidas:', estadisticas);
            res.json(estadisticas);
            
        } catch (err) {
            console.error('❌ Error obteniendo estadísticas:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
// routes/talleres.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Listar todos los talleres
    router.get('/', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    TAL_CODIGO,
                    TAL_NOMBRE,
                    TAL_DESCRIPCION,
                    TAL_UBICACION
                 FROM TALLER
                 ORDER BY TAL_NOMBRE`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo talleres:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Listar cursos
    router.get('/cursos', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    c.CUR_CODIGO,
                    c.CUR_NOMBRE,
                    c.CUR_NIVEL,
                    c.CUR_ANIO,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM CURSO c
                 LEFT JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 ORDER BY c.CUR_NIVEL, c.CUR_NOMBRE`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo cursos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Listar grupos
    router.get('/grupos', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    g.GRU_ID,
                    g.GRU_NOMBRE,
                    g.GRU_CANTIDAD_INTEGRANTES,
                    c.CUR_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM GRUPO g
                 INNER JOIN CURSO c ON g.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 ORDER BY c.CUR_NOMBRE, g.GRU_NOMBRE`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo grupos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Grupos sin préstamo
    router.get('/grupos/sin-prestamo', async (req, res) => {
        let connection;
        try {
            const { anio } = req.query;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    g.GRU_ID,
                    g.GRU_NOMBRE,
                    c.CUR_NOMBRE AS CURSO_NOMBRE,
                    t.TAL_CODIGO,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM GRUPO g
                 INNER JOIN CURSO c ON g.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE NOT EXISTS (
                     SELECT 1 FROM PRESTAMO p 
                     WHERE p.GRU_ID = g.GRU_ID 
                     AND p.PRE_ANIO = :anio
                     AND p.PRE_ESTADO = 'ACTIVO'
                 )
                 ORDER BY t.TAL_NOMBRE, c.CUR_NOMBRE, g.GRU_NOMBRE`,
                { anio: anio || new Date().getFullYear() }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo grupos sin préstamo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Integrantes de un grupo
    router.get('/grupos/:id/integrantes', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    ig.ING_ID,
                    ig.ALU_RUT,
                    ig.ING_ROL,
                    a.ALU_NOMBRES,
                    a.ALU_APELLIDOS,
                    a.ALU_EMAIL
                 FROM INTEGRANTES_GRUPO ig
                 INNER JOIN ALUMNO a ON ig.ALU_RUT = a.ALU_RUT
                 WHERE ig.GRU_ID = :id
                 ORDER BY ig.ING_ROL DESC, a.ALU_APELLIDOS`,
                { id }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo integrantes:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Verificar si un grupo tiene préstamo activo (usa función PL/SQL)
    router.get('/grupos/:id/tiene-prestamo', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            const { anio } = req.query;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT pkg_gestion_prestamos.fn_grupo_tiene_prestamo(:grupoId, :anio) AS TIENE_PRESTAMO FROM DUAL`,
                { 
                    grupoId: id,
                    anio: anio || new Date().getFullYear()
                }
            );

            const tiene_prestamo = result.rows[0].TIENE_PRESTAMO === 1;
            res.json({ tiene_prestamo: tiene_prestamo });

        } catch (err) {
            console.error("Error verificando préstamo del grupo:", err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
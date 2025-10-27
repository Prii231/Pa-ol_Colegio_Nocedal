// routes/alumnos.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Listar todos los alumnos
    router.get('/', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    a.ALU_RUT,
                    a.ALU_NOMBRES,
                    a.ALU_APELLIDOS,
                    a.ALU_EMAIL,
                    a.ALU_TELEFONO,
                    a.ALU_ESTADO,
                    a.CUR_CODIGO,
                    c.CUR_NOMBRE
                 FROM ALUMNO a
                 LEFT JOIN CURSO c ON a.CUR_CODIGO = c.CUR_CODIGO
                 ORDER BY a.ALU_APELLIDOS, a.ALU_NOMBRES`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo alumnos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Crear nuevo alumno
    router.post('/', async (req, res) => {
        let connection;
        try {
            const { alu_rut, alu_nombres, alu_apellidos, alu_email, alu_telefono, cur_codigo } = req.body;
            connection = await pool.getConnection();
            
            await connection.execute(
                `INSERT INTO ALUMNO (ALU_RUT, ALU_NOMBRES, ALU_APELLIDOS, ALU_EMAIL, ALU_TELEFONO, ALU_ESTADO, CUR_CODIGO)
                 VALUES (:rut, :nombres, :apellidos, :email, :telefono, 'ACTIVO', :curso)`,
                {
                    rut: alu_rut,
                    nombres: alu_nombres,
                    apellidos: alu_apellidos,
                    email: alu_email,
                    telefono: alu_telefono,
                    curso: cur_codigo
                },
                { autoCommit: true }
            );
            
            res.status(201).json({ success: true, message: 'Alumno creado exitosamente' });
            
        } catch (err) {
            console.error('Error creando alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // PUT - Actualizar alumno
    router.put('/:rut', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            const { alu_nombres, alu_apellidos, alu_email, alu_telefono, cur_codigo } = req.body;
            connection = await pool.getConnection();
            
            await connection.execute(
                `UPDATE ALUMNO 
                 SET ALU_NOMBRES = :nombres,
                     ALU_APELLIDOS = :apellidos,
                     ALU_EMAIL = :email,
                     ALU_TELEFONO = :telefono,
                     CUR_CODIGO = :curso
                 WHERE ALU_RUT = :rut`,
                {
                    nombres: alu_nombres,
                    apellidos: alu_apellidos,
                    email: alu_email,
                    telefono: alu_telefono,
                    curso: cur_codigo,
                    rut: rut
                },
                { autoCommit: true }
            );
            
            res.status(200).json({ success: true, message: 'Alumno actualizado exitosamente' });
            
        } catch (err) {
            console.error('Error actualizando alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // PUT - Cambiar estado del alumno
    router.put('/:rut/estado', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            const { estado } = req.body;
            connection = await pool.getConnection();
            
            await connection.execute(
                `UPDATE ALUMNO 
                 SET ALU_ESTADO = :estado
                 WHERE ALU_RUT = :rut`,
                {
                    estado: estado,
                    rut: rut
                },
                { autoCommit: true }
            );
            
            res.status(200).json({ success: true, message: 'Estado actualizado exitosamente' });
            
        } catch (err) {
            console.error('Error actualizando estado:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener un alumno específico
    router.get('/:rut', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    a.ALU_RUT,
                    a.ALU_NOMBRES,
                    a.ALU_APELLIDOS,
                    a.ALU_EMAIL,
                    a.ALU_TELEFONO,
                    a.ALU_ESTADO,
                    a.CUR_CODIGO,
                    c.CUR_NOMBRE
                 FROM ALUMNO a
                 LEFT JOIN CURSO c ON a.CUR_CODIGO = c.CUR_CODIGO
                 WHERE a.ALU_RUT = :rut`,
                { rut }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Alumno no encontrado' });
            }
            
        } catch (err) {
            console.error('Error obteniendo alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener historial de un alumno
    router.get('/:rut/historial', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    h.HIS_ID,
                    h.HIS_FECHA,
                    h.HIS_TIPO_MOVIMIENTO,
                    h.HIS_OBSERVACIONES,
                    i.ITM_NOMBRE,
                    ii.INV_ESTADO
                 FROM HISTORIAL_MOVIMIENTOS h
                 LEFT JOIN INV_ITEMS ii ON h.INV_ID = ii.INV_ID
                 LEFT JOIN ITM i ON ii.ITM_CODIGO = i.ITM_CODIGO
                 WHERE h.ALU_RUT = :rut
                 ORDER BY h.HIS_FECHA DESC`,
                { rut }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo historial:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener grupos del alumno
    router.get('/:rut/grupos', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    ig.ING_ID,
                    ig.ING_ROL,
                    g.GRU_ID,
                    g.GRU_NOMBRE,
                    c.CUR_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM INTEGRANTES_GRUPO ig
                 INNER JOIN GRUPO g ON ig.GRU_ID = g.GRU_ID
                 INNER JOIN CURSO c ON g.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE ig.ALU_RUT = :rut
                 ORDER BY c.CUR_NOMBRE, g.GRU_NOMBRE`,
                { rut }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo grupos del alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
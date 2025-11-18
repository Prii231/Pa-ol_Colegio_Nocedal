// routes/alumnos.js - BACKEND COMPLETO Y CORREGIDO

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // =============================================
    // GET - Listar todos los alumnos
    // =============================================
    router.get('/', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();

            console.log('👥 Obteniendo alumnos...');

            const result = await connection.execute(
                `SELECT 
                    a.ALU_RUT,
                    a.ALU_NOMBRES,
                    a.ALU_APELLIDOS,
                    a.ALU_EMAIL,
                    a.ALU_TELEFONO,
                    a.ALU_ESTADO,
                    a.ALU_ANIO_INGRESO,
                    a.CUR_CODIGO,
                    c.CUR_NIVEL || ' ' || c.CUR_LETRA AS CURSO_NOMBRE,
                    t.TAL_CODIGO AS TALLER_CODIGO,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    ig.GRU_ID,
                    g.GRU_NOMBRE AS GRUPO_NOMBRE,
                    ig.ING_ROL
                 FROM ALUMNOS a
                 LEFT JOIN CURSOS c ON a.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 LEFT JOIN INTEGRANTES_GRUPO ig ON a.ALU_RUT = ig.ALU_RUT
                 LEFT JOIN GRUPOS_TRABAJO g ON ig.GRU_ID = g.GRU_ID
                 ORDER BY a.ALU_APELLIDOS, a.ALU_NOMBRES`
            );

            console.log('✅ Alumnos encontrados:', result.rows.length);

            // Convertir a minúsculas
            const alumnos = result.rows.map(row => ({
                alu_rut: row.ALU_RUT,
                alu_nombres: row.ALU_NOMBRES,
                alu_apellidos: row.ALU_APELLIDOS,
                alu_email: row.ALU_EMAIL,
                alu_telefono: row.ALU_TELEFONO,
                alu_estado: row.ALU_ESTADO,
                alu_anio_ingreso: row.ALU_ANIO_INGRESO,
                cur_codigo: row.CUR_CODIGO,
                curso_nombre: row.CURSO_NOMBRE,
                taller_codigo: row.TALLER_CODIGO,
                taller_nombre: row.TALLER_NOMBRE,
                gru_id: row.GRU_ID,
                grupo_nombre: row.GRUPO_NOMBRE,
                ing_rol: row.ING_ROL
            }));

            res.json(alumnos);

        } catch (err) {
            console.error('❌ Error obteniendo alumnos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // POST - Crear nuevo alumno
    // =============================================
    router.post('/', async (req, res) => {
        let connection;
        try {
            const { alu_rut, alu_nombres, alu_apellidos, alu_email, alu_telefono, cur_codigo, alu_anio_ingreso, gru_id } = req.body;

            console.log('➕ Creando alumno:', alu_rut);

            connection = await pool.getConnection();

            // Insertar alumno
            await connection.execute(
                `INSERT INTO ALUMNOS (ALU_RUT, ALU_NOMBRES, ALU_APELLIDOS, ALU_EMAIL, ALU_TELEFONO, ALU_ESTADO, CUR_CODIGO, ALU_ANIO_INGRESO)
                 VALUES (:rut, :nombres, :apellidos, :email, :telefono, 'ACTIVO', :curso, :anio)`,
                {
                    rut: alu_rut,
                    nombres: alu_nombres,
                    apellidos: alu_apellidos,
                    email: alu_email || null,
                    telefono: alu_telefono || null,
                    curso: cur_codigo,
                    anio: alu_anio_ingreso || new Date().getFullYear()
                },
                { autoCommit: false }
            );

            // Si se asignó a un grupo, agregar a integrantes
            if (gru_id) {
                await connection.execute(
                    `INSERT INTO INTEGRANTES_GRUPO (ING_ID, ALU_RUT, GRU_ID, ING_ROL)
                     VALUES (SEQ_INTEGRANTE.NEXTVAL, :rut, :gru_id, 'INTEGRANTE')`,
                    {
                        rut: alu_rut,
                        gru_id: gru_id
                    },
                    { autoCommit: false }
                );
            }

            await connection.commit();

            console.log('✅ Alumno creado exitosamente');
            res.status(201).json({ success: true, message: 'Alumno creado exitosamente' });

        } catch (err) {
            if (connection) await connection.rollback();
            console.error('❌ Error creando alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // PUT - Actualizar alumno
    // =============================================
    router.put('/:rut', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            const { alu_nombres, alu_apellidos, alu_email, alu_telefono, cur_codigo, alu_anio_ingreso } = req.body;

            console.log('✏️ Actualizando alumno:', rut);

            connection = await pool.getConnection();

            await connection.execute(
                `UPDATE ALUMNOS 
                 SET ALU_NOMBRES = :nombres,
                     ALU_APELLIDOS = :apellidos,
                     ALU_EMAIL = :email,
                     ALU_TELEFONO = :telefono,
                     CUR_CODIGO = :curso,
                     ALU_ANIO_INGRESO = :anio
                 WHERE ALU_RUT = :rut`,
                {
                    nombres: alu_nombres,
                    apellidos: alu_apellidos,
                    email: alu_email || null,
                    telefono: alu_telefono || null,
                    curso: cur_codigo,
                    anio: alu_anio_ingreso,
                    rut: rut
                },
                { autoCommit: true }
            );

            console.log('✅ Alumno actualizado');
            res.json({ success: true, message: 'Alumno actualizado exitosamente' });

        } catch (err) {
            console.error('❌ Error actualizando alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // PUT - Cambiar estado del alumno
    // =============================================
    router.put('/:rut/estado', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            const { alu_estado } = req.body;

            console.log('🔄 Cambiando estado de alumno:', rut, 'a', alu_estado);

            connection = await pool.getConnection();

            await connection.execute(
                `UPDATE ALUMNOS 
                 SET ALU_ESTADO = :estado
                 WHERE ALU_RUT = :rut`,
                {
                    estado: alu_estado,
                    rut: rut
                },
                { autoCommit: true }
            );

            console.log('✅ Estado actualizado');
            res.json({ success: true, message: 'Estado actualizado exitosamente' });

        } catch (err) {
            console.error('❌ Error actualizando estado:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // GET - Obtener un alumno específico
    // =============================================
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
                    a.ALU_ANIO_INGRESO,
                    a.CUR_CODIGO,
                    c.CUR_NIVEL || ' ' || c.CUR_LETRA AS CURSO_NOMBRE
                 FROM ALUMNOS a
                 LEFT JOIN CURSOS c ON a.CUR_CODIGO = c.CUR_CODIGO
                 WHERE a.ALU_RUT = :rut`,
                { rut }
            );

            if (result.rows.length > 0) {
                const alumno = {
                    alu_rut: result.rows[0].ALU_RUT,
                    alu_nombres: result.rows[0].ALU_NOMBRES,
                    alu_apellidos: result.rows[0].ALU_APELLIDOS,
                    alu_email: result.rows[0].ALU_EMAIL,
                    alu_telefono: result.rows[0].ALU_TELEFONO,
                    alu_estado: result.rows[0].ALU_ESTADO,
                    alu_anio_ingreso: result.rows[0].ALU_ANIO_INGRESO,
                    cur_codigo: result.rows[0].CUR_CODIGO,
                    curso_nombre: result.rows[0].CURSO_NOMBRE
                };
                res.json(alumno);
            } else {
                res.status(404).json({ success: false, message: 'Alumno no encontrado' });
            }

        } catch (err) {
            console.error('❌ Error obteniendo alumno:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // GET - Obtener historial de un alumno
    // =============================================
    router.get('/:rut/historial', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            connection = await pool.getConnection();

            // Nota: Esta tabla puede no existir aún
            const result = await connection.execute(
                `SELECT 
                    HIS_ID,
                    HIS_FECHA,
                    HIS_TIPO_MOVIMIENTO,
                    HIS_OBSERVACIONES
                 FROM HISTORIAL_MOVIMIENTOS
                 WHERE ALU_RUT = :rut
                 ORDER BY HIS_FECHA DESC`,
                { rut }
            );

            const historial = result.rows.map(row => ({
                his_id: row.HIS_ID,
                fecha: row.HIS_FECHA,
                tipo: row.HIS_TIPO_MOVIMIENTO,
                descripcion: row.HIS_OBSERVACIONES
            }));

            res.json(historial);

        } catch (err) {
            // Si la tabla no existe, retornar array vacío
            if (err.message.includes('ORA-00942')) {
                console.log('⚠️  Tabla HISTORIAL_MOVIMIENTOS no existe');
                return res.json([]);
            }
            console.error('❌ Error obteniendo historial:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // POST - Asignar alumno a grupo (o actualizar rol)
    // =============================================
    router.post('/grupos/integrantes', async (req, res) => {
        let connection;
        try {
            const { alu_rut, gru_id, ing_rol } = req.body;

            console.log('👥 Asignando alumno a grupo:', { alu_rut, gru_id, ing_rol });

            connection = await pool.getConnection();

            // 1. Verificar si ya existe (buscamos por RUT y GRUPO, no por ID)
            const existe = await connection.execute(
                `SELECT alu_rut FROM integrantes_grupo 
                 WHERE alu_rut = :rut AND gru_id = :gru_id`,
                { rut: alu_rut, gru_id: gru_id }
            );

            if (existe.rows.length > 0) {
                // Actualizar rol si ya existe
                await connection.execute(
                    `UPDATE integrantes_grupo 
                     SET ing_rol = :rol
                     WHERE alu_rut = :rut AND gru_id = :gru_id`,
                    {
                        rol: ing_rol || 'INTEGRANTE',
                        rut: alu_rut,
                        gru_id: gru_id
                    },
                    { autoCommit: true }
                );
            } else {
                // CORRECCIÓN: Insertar SIN 'ING_ID' ni secuencia
                await connection.execute(
                    `INSERT INTO integrantes_grupo (alu_rut, gru_id, ing_rol)
                     VALUES (:rut, :gru_id, :rol)`,
                    {
                        rut: alu_rut,
                        gru_id: gru_id,
                        rol: ing_rol || 'INTEGRANTE'
                    },
                    { autoCommit: true }
                );
            }

            console.log('✅ Alumno asignado a grupo');
            res.json({ success: true, message: 'Alumno asignado exitosamente' });

        } catch (err) {
            console.error('❌ Error asignando alumno a grupo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // DELETE - Remover alumno de grupo (al desasignar)
    // =============================================
    router.delete('/grupos/integrantes/:rut', async (req, res) => {
        let connection;
        try {
            const { rut } = req.params;
            console.log('🗑️ Removiendo alumno de grupo:', rut);

            connection = await pool.getConnection();

            // Eliminamos la fila de la tabla de unión
            await connection.execute(
                `DELETE FROM integrantes_grupo WHERE alu_rut = :rut`,
                { rut },
                { autoCommit: true }
            );

            res.json({ success: true, message: 'Alumno removido del grupo' });
        } catch (err) {
            console.error('❌ Error removiendo alumno del grupo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });



    return router;
};
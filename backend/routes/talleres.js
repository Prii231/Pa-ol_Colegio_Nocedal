// routes/talleres.js - COMPLETO (Talleres, Cursos y Grupos)

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // =============================================
    // RUTAS DE TALLERES
    // =============================================

    // GET - Listar todos los talleres
    router.get('/talleres', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('🔧 Obteniendo talleres...');
            
            const result = await connection.execute(
                `SELECT 
                    TAL_CODIGO as tal_codigo,
                    TAL_NOMBRE as tal_nombre,
                    TAL_DESCRIPCION as tal_descripcion,
                    TAL_UBICACION as tal_ubicacion,
                    TAL_DOCENTE_ENCARGADO as tal_docente_encargado
                 FROM TALLERES
                 ORDER BY TAL_NOMBRE`
            );
            
            console.log('✅ Talleres encontrados:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo talleres:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Crear nuevo taller
    router.post('/talleres', async (req, res) => {
        let connection;
        try {
            // Aceptar múltiples formatos de nombres de campos
            const tal_codigo = req.body.tal_codigo || req.body.TAL_CODIGO || req.body.talCodigo;
            const tal_nombre = req.body.tal_nombre || req.body.TAL_NOMBRE || req.body.talNombre;
            const tal_descripcion = req.body.tal_descripcion || req.body.TAL_DESCRIPCION || req.body.talDescripcion || '';
            const tal_ubicacion = req.body.tal_ubicacion || req.body.TAL_UBICACION || req.body.talUbicacion || '';
            const tal_docente_encargado = req.body.tal_docente_encargado || req.body.TAL_DOCENTE_ENCARGADO || req.body.talDocenteEncargado || null;
            
            console.log('➕ Creando nuevo taller:', tal_codigo);
            console.log('📦 Datos recibidos:', req.body);
            console.log('📋 Datos procesados:', { tal_codigo, tal_nombre, tal_descripcion, tal_ubicacion, tal_docente_encargado });
            
            // Validar campos requeridos
            if (!tal_codigo || !tal_nombre) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Los campos TAL_CODIGO y TAL_NOMBRE son requeridos',
                    received: req.body
                });
            }
            
            connection = await pool.getConnection();
            
            await connection.execute(
                `INSERT INTO TALLERES (TAL_CODIGO, TAL_NOMBRE, TAL_DESCRIPCION, TAL_UBICACION, TAL_DOCENTE_ENCARGADO)
                 VALUES (:codigo, :nombre, :descripcion, :ubicacion, :docente)`,
                {
                    codigo: tal_codigo,
                    nombre: tal_nombre,
                    descripcion: tal_descripcion,
                    ubicacion: tal_ubicacion,
                    docente: tal_docente_encargado
                },
                { autoCommit: true }
            );
            
            console.log('✅ Taller creado exitosamente');
            res.status(201).json({ success: true, message: 'Taller creado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error creando taller:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener un taller específico
    router.get('/talleres/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    TAL_CODIGO,
                    TAL_NOMBRE,
                    TAL_DESCRIPCION,
                    TAL_UBICACION,
                    TAL_DOCENTE_ENCARGADO
                 FROM TALLERES
                 WHERE TAL_CODIGO = :codigo`,
                { codigo }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Taller no encontrado' });
            }
            
        } catch (err) {
            console.error('❌ Error obteniendo taller:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // PUT - Actualizar taller
    router.put('/talleres/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            const { tal_nombre, tal_descripcion, tal_ubicacion, tal_docente_encargado } = req.body;
            connection = await pool.getConnection();
            
            console.log('✏️ Actualizando taller:', codigo);
            
            await connection.execute(
                `UPDATE TALLERES
                 SET TAL_NOMBRE = :nombre,
                     TAL_DESCRIPCION = :descripcion,
                     TAL_UBICACION = :ubicacion,
                     TAL_DOCENTE_ENCARGADO = :docente
                 WHERE TAL_CODIGO = :codigo`,
                {
                    nombre: tal_nombre,
                    descripcion: tal_descripcion,
                    ubicacion: tal_ubicacion,
                    docente: tal_docente_encargado,
                    codigo: codigo
                },
                { autoCommit: true }
            );
            
            console.log('✅ Taller actualizado exitosamente');
            res.json({ success: true, message: 'Taller actualizado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error actualizando taller:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // DELETE - Eliminar taller
    router.delete('/talleres/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            console.log('🗑️ Eliminando taller:', codigo);
            
            await connection.execute(
                `DELETE FROM TALLERES WHERE TAL_CODIGO = :codigo`,
                { codigo },
                { autoCommit: true }
            );
            
            console.log('✅ Taller eliminado exitosamente');
            res.json({ success: true, message: 'Taller eliminado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error eliminando taller:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // RUTAS DE CURSOS
    // =============================================

    // GET - Listar todos los cursos
    router.get('/cursos', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('📚 Obteniendo cursos...');
            
            const result = await connection.execute(
                `SELECT 
                    c.CUR_CODIGO,
                    c.CUR_NIVEL,
                    c.CUR_LETRA,
                    c.CUR_ANIO,
                    c.TAL_CODIGO,
                    c.CUR_CANTIDAD_ALUMNOS,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    c.CUR_NIVEL || c.CUR_LETRA AS CURSO_NOMBRE
                 FROM CURSOS c
                 LEFT JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 ORDER BY c.CUR_NIVEL, c.CUR_LETRA`
            );
            
            console.log('✅ Cursos encontrados:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo cursos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Crear nuevo curso
    router.post('/cursos', async (req, res) => {
        let connection;
        try {
            const { cur_codigo, cur_nivel, cur_letra, cur_anio, tal_codigo, cur_cantidad_alumnos } = req.body;
            connection = await pool.getConnection();
            
            console.log('➕ Creando nuevo curso:', cur_codigo);
            
            await connection.execute(
                `INSERT INTO CURSOS (CUR_CODIGO, CUR_NIVEL, CUR_LETRA, CUR_ANIO, TAL_CODIGO, CUR_CANTIDAD_ALUMNOS)
                 VALUES (:codigo, :nivel, :letra, :anio, :taller, :cantidad)`,
                {
                    codigo: cur_codigo,
                    nivel: cur_nivel,
                    letra: cur_letra,
                    anio: cur_anio,
                    taller: tal_codigo,
                    cantidad: cur_cantidad_alumnos || 30
                },
                { autoCommit: true }
            );
            
            console.log('✅ Curso creado exitosamente');
            res.status(201).json({ success: true, message: 'Curso creado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error creando curso:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener un curso específico
    router.get('/cursos/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    c.CUR_CODIGO,
                    c.CUR_NIVEL,
                    c.CUR_LETRA,
                    c.CUR_ANIO,
                    c.TAL_CODIGO,
                    c.CUR_CANTIDAD_ALUMNOS,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    c.CUR_NIVEL || c.CUR_LETRA AS CURSO_NOMBRE
                 FROM CURSOS c
                 LEFT JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE c.CUR_CODIGO = :codigo`,
                { codigo }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Curso no encontrado' });
            }
            
        } catch (err) {
            console.error('❌ Error obteniendo curso:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // PUT - Actualizar curso
    router.put('/cursos/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            const { cur_nivel, cur_letra, cur_anio, tal_codigo, cur_cantidad_alumnos } = req.body;
            connection = await pool.getConnection();
            
            console.log('✏️ Actualizando curso:', codigo);
            
            await connection.execute(
                `UPDATE CURSOS
                 SET CUR_NIVEL = :nivel,
                     CUR_LETRA = :letra,
                     CUR_ANIO = :anio,
                     TAL_CODIGO = :taller,
                     CUR_CANTIDAD_ALUMNOS = :cantidad
                 WHERE CUR_CODIGO = :codigo`,
                {
                    nivel: cur_nivel,
                    letra: cur_letra,
                    anio: cur_anio,
                    taller: tal_codigo,
                    cantidad: cur_cantidad_alumnos,
                    codigo: codigo
                },
                { autoCommit: true }
            );
            
            console.log('✅ Curso actualizado exitosamente');
            res.json({ success: true, message: 'Curso actualizado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error actualizando curso:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // DELETE - Eliminar curso
    router.delete('/cursos/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            console.log('🗑️ Eliminando curso:', codigo);
            
            await connection.execute(
                `DELETE FROM CURSOS WHERE CUR_CODIGO = :codigo`,
                { codigo },
                { autoCommit: true }
            );
            
            console.log('✅ Curso eliminado exitosamente');
            res.json({ success: true, message: 'Curso eliminado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error eliminando curso:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener grupos de un curso
    router.get('/cursos/:codigo/grupos', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    GRU_ID,
                    GRU_NUMERO,
                    GRU_NOMBRE,
                    CUR_CODIGO,
                    GRU_ANIO,
                    GRU_ESTADO
                 FROM GRUPOS_TRABAJO
                 WHERE CUR_CODIGO = :codigo
                 AND GRU_ESTADO = 'ACTIVO'
                 ORDER BY GRU_NUMERO`,
                { codigo }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo grupos del curso:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // =============================================
    // RUTAS DE GRUPOS
    // =============================================

    // GET - Listar todos los grupos
    router.get('/grupos', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            console.log('👥 Obteniendo grupos...');
            
            const result = await connection.execute(
                `SELECT 
                    g.GRU_ID,
                    g.GRU_NUMERO,
                    g.GRU_NOMBRE,
                    g.CUR_CODIGO,
                    g.GRU_ANIO,
                    g.GRU_ESTADO,
                    c.CUR_NIVEL || c.CUR_LETRA AS CURSO_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM GRUPOS_TRABAJO g
                 INNER JOIN CURSOS c ON g.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE g.GRU_ESTADO = 'ACTIVO'
                 ORDER BY c.CUR_NIVEL, c.CUR_LETRA, g.GRU_NUMERO`
            );
            
            console.log('✅ Grupos encontrados:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo grupos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Crear nuevo grupo
    router.post('/grupos', async (req, res) => {
        let connection;
        try {
            const { gru_numero, gru_nombre, cur_codigo, gru_anio, gru_estado } = req.body;
            connection = await pool.getConnection();
            
            console.log('➕ Creando nuevo grupo:', gru_nombre);
            
            // Oracle genera el GRU_ID automáticamente si es auto-incremental
            // Si no, necesitarías obtener el siguiente ID de una secuencia
            await connection.execute(
                `INSERT INTO GRUPOS_TRABAJO (GRU_NUMERO, GRU_NOMBRE, CUR_CODIGO, GRU_ANIO, GRU_ESTADO)
                 VALUES (:numero, :nombre, :curso, :anio, :estado)`,
                {
                    numero: gru_numero,
                    nombre: gru_nombre,
                    curso: cur_codigo,
                    anio: gru_anio || new Date().getFullYear(),
                    estado: gru_estado || 'ACTIVO'
                },
                { autoCommit: true }
            );
            
            console.log('✅ Grupo creado exitosamente');
            res.status(201).json({ success: true, message: 'Grupo creado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error creando grupo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Grupos sin préstamo activo
    router.get('/grupos/sin-prestamo', async (req, res) => {
        let connection;
        try {
            const { anio } = req.query;
            connection = await pool.getConnection();
            
            console.log('🔍 Buscando grupos sin préstamo para año:', anio || new Date().getFullYear());
            
            const result = await connection.execute(
                `SELECT 
                    g.GRU_ID,
                    g.GRU_NOMBRE,
                    g.GRU_NUMERO,
                    c.CUR_NIVEL || c.CUR_LETRA AS CURSO_NOMBRE,
                    t.TAL_CODIGO,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM GRUPOS_TRABAJO g
                 INNER JOIN CURSOS c ON g.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE g.GRU_ESTADO = 'ACTIVO'
                 AND NOT EXISTS (
                     SELECT 1 FROM PRESTAMOS_ANUALES p 
                     WHERE p.GRU_ID = g.GRU_ID 
                     AND p.PRE_ANIO = :anio
                     AND p.PRE_ESTADO = 'ACTIVO'
                 )
                 ORDER BY t.TAL_NOMBRE, c.CUR_NIVEL, c.CUR_LETRA, g.GRU_NUMERO`,
                { anio: anio || new Date().getFullYear() }
            );
            
            console.log('✅ Grupos sin préstamo:', result.rows.length);
            res.json(result.rows);
            
        } catch (err) {
            console.error('❌ Error obteniendo grupos sin préstamo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Obtener un grupo específico
    router.get('/grupos/:id', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    g.GRU_ID,
                    g.GRU_NUMERO,
                    g.GRU_NOMBRE,
                    g.CUR_CODIGO,
                    g.GRU_ANIO,
                    g.GRU_ESTADO,
                    c.CUR_NIVEL || c.CUR_LETRA AS CURSO_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    t.TAL_CODIGO
                 FROM GRUPOS_TRABAJO g
                 INNER JOIN CURSOS c ON g.CUR_CODIGO = c.CUR_CODIGO
                 LEFT JOIN TALLERES t ON c.TAL_CODIGO = t.TAL_CODIGO
                 WHERE g.GRU_ID = :id`,
                { id }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Grupo no encontrado' });
            }
            
        } catch (err) {
            console.error('❌ Error obteniendo grupo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // PUT - Actualizar grupo
    router.put('/grupos/:id', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            const { gru_numero, gru_nombre, cur_codigo, gru_anio, gru_estado } = req.body;
            connection = await pool.getConnection();
            
            console.log('✏️ Actualizando grupo:', id);
            
            await connection.execute(
                `UPDATE GRUPOS_TRABAJO
                 SET GRU_NUMERO = :numero,
                     GRU_NOMBRE = :nombre,
                     CUR_CODIGO = :curso,
                     GRU_ANIO = :anio,
                     GRU_ESTADO = :estado
                 WHERE GRU_ID = :id`,
                {
                    numero: gru_numero,
                    nombre: gru_nombre,
                    curso: cur_codigo,
                    anio: gru_anio,
                    estado: gru_estado,
                    id: id
                },
                { autoCommit: true }
            );
            
            console.log('✅ Grupo actualizado exitosamente');
            res.json({ success: true, message: 'Grupo actualizado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error actualizando grupo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // DELETE - Eliminar grupo (cambiar estado a INACTIVO)
    router.delete('/grupos/:id', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            connection = await pool.getConnection();
            
            console.log('🗑️ Desactivando grupo:', id);
            
            // En lugar de eliminar, cambiar estado a INACTIVO
            await connection.execute(
                `UPDATE GRUPOS_TRABAJO SET GRU_ESTADO = 'INACTIVO' WHERE GRU_ID = :id`,
                { id },
                { autoCommit: true }
            );
            
            console.log('✅ Grupo desactivado exitosamente');
            res.json({ success: true, message: 'Grupo desactivado exitosamente' });
            
        } catch (err) {
            console.error('❌ Error desactivando grupo:', err.message);
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
                 INNER JOIN ALUMNOS a ON ig.ALU_RUT = a.ALU_RUT
                 WHERE ig.GRU_ID = :id
                 ORDER BY ig.ING_ROL DESC, a.ALU_APELLIDOS`,
                { id }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            // Si la tabla no existe, retornar array vacío
            if (err.message.includes('ORA-00942')) {
                console.log('⚠️  Tabla INTEGRANTES_GRUPO no existe');
                return res.json([]);
            }
            
            console.error('❌ Error obteniendo integrantes:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Verificar si un grupo tiene préstamo activo
    router.get('/grupos/:id/tiene-prestamo', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            const { anio } = req.query;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT COUNT(*) AS TIENE_PRESTAMO
                 FROM PRESTAMOS_ANUALES
                 WHERE GRU_ID = :id
                 AND PRE_ANIO = :anio
                 AND PRE_ESTADO = 'ACTIVO'`,
                { 
                    id: id,
                    anio: anio || new Date().getFullYear()
                }
            );

            const tiene_prestamo = result.rows[0].TIENE_PRESTAMO > 0;
            res.json({ tiene_prestamo: tiene_prestamo });

        } catch (err) {
            console.error('❌ Error verificando préstamo del grupo:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
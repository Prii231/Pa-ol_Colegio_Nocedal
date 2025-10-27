// routes/prestamos.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Listar préstamos por año
    router.get('/', async (req, res) => {
        let connection;
        try {
            const { anio } = req.query;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    p.PRE_ID,
                    p.PRE_FECHA_INICIO,
                    p.PRE_FECHA_FIN,
                    p.PRE_ESTADO,
                    p.PRE_OBSERVACIONES_PRESTAMO,
                    p.CAJ_CODIGO,
                    p.GRU_ID,
                    c.CAJ_NUMERO,
                    g.GRU_NOMBRE AS GRUPO_NOMBRE,
                    cu.CUR_NOMBRE,
                    t.TAL_CODIGO,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    d.DOC_NOMBRE || ' ' || d.DOC_APELLIDO AS DOCENTE_NOMBRE
                 FROM PRESTAMO p
                 INNER JOIN CAJA c ON p.CAJ_CODIGO = c.CAJ_CODIGO
                 INNER JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 INNER JOIN CURSO cu ON g.CUR_CODIGO = cu.CUR_CODIGO
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 LEFT JOIN DOCENTE d ON p.DOC_RUT = d.DOC_RUT
                 WHERE p.PRE_ANIO = :anio
                 ORDER BY p.PRE_FECHA_INICIO DESC`,
                { anio: anio || new Date().getFullYear() }
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo préstamos:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });
    
    // POST - Asignar préstamo anual (usa package PL/SQL)
    router.post('/asignar-caja-anual', async (req, res) => {
        let connection;
        try {
            const { p_grupo_id, p_caja_codigo, p_docente_rut, p_anio, observaciones } = req.body;
            connection = await pool.getConnection();

            await connection.execute(
                `BEGIN 
                   pkg_gestion_prestamos.sp_asignar_caja_anual(
                       :grupoId, :cajaCodigo, :docenteRut, :anio, :obs
                   );
                 END;`,
                {
                    grupoId: p_grupo_id,
                    cajaCodigo: p_caja_codigo,
                    docenteRut: p_docente_rut,
                    anio: p_anio,
                    obs: observaciones || null
                },
                { autoCommit: true }
            );

            res.status(200).json({ success: true, message: "Préstamo registrado exitosamente" });

        } catch (err) {
            console.error("Error al asignar caja anual:", err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Devolución de caja (usa package PL/SQL)
    router.post('/devolver-caja', async (req, res) => {
        let connection;
        try {
            const { p_prestamo_id, p_docente_rut, p_observaciones, items_revision } = req.body;
            connection = await pool.getConnection();
            
            // 1. Llamar al SP de Devolución
            await connection.execute(
                `BEGIN
                   pkg_gestion_prestamos.sp_devolver_caja(
                       :prestamoId, :docenteRut, :observaciones
                   );
                 END;`,
                {
                    prestamoId: p_prestamo_id,
                    docenteRut: p_docente_rut,
                    observaciones: p_observaciones
                },
                { autoCommit: false } 
            );
            
            // 2. Registrar items problemáticos (FALTANTE/DAÑADO)
            if (items_revision && items_revision.length > 0) {
                for (const item of items_revision) {
                    if (item.requiere_reposicion === 'S') {
                        await connection.execute(
                            `BEGIN
                               pkg_inventario.sp_registrar_item_faltante(
                                   :prestamoId, :invId, :descripcion, :tipoProblema, :usuario
                               );
                             END;`,
                            {
                                prestamoId: p_prestamo_id,
                                invId: item.inv_id,
                                descripcion: item.observaciones,
                                tipoProblema: item.presente === 'N' ? 'FALTANTE' : 'DAÑADO',
                                usuario: p_docente_rut
                            },
                            { autoCommit: false }
                        );
                    }
                }
            }

            // 3. Confirmar la transacción
            await connection.commit();
            res.status(200).json({ success: true, message: "Devolución registrada exitosamente" });

        } catch (err) {
            console.error("Error en devolución de caja:", err.message);
            if (connection) await connection.rollback();
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Detalle de un préstamo
    router.get('/:id', async (req, res) => {
        let connection;
        try {
            const { id } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    p.*,
                    c.CAJ_NUMERO,
                    g.GRU_NOMBRE AS GRUPO_NOMBRE,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    d.DOC_NOMBRE || ' ' || d.DOC_APELLIDO AS DOCENTE_NOMBRE
                 FROM PRESTAMO p
                 INNER JOIN CAJA c ON p.CAJ_CODIGO = c.CAJ_CODIGO
                 INNER JOIN GRUPO g ON p.GRU_ID = g.GRU_ID
                 INNER JOIN TALLER t ON c.TAL_CODIGO = t.TAL_CODIGO
                 LEFT JOIN DOCENTE d ON p.DOC_RUT = d.DOC_RUT
                 WHERE p.PRE_ID = :id`,
                { id }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Préstamo no encontrado' });
            }
            
        } catch (err) {
            console.error('Error obteniendo detalle:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
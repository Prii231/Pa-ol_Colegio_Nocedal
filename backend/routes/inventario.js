// routes/inventario.js

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // GET - Listar items del inventario
    router.get('/', async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    i.ITM_CODIGO,
                    i.ITM_NOMBRE,
                    i.ITM_DESCRIPCION,
                    i.ITM_CATEGORIA,
                    t.TAL_NOMBRE AS TALLER_NOMBRE,
                    COUNT(ii.INV_ID) AS TOTAL_UNIDADES,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'DISPONIBLE' THEN 1 END) AS UNIDADES_DISPONIBLES,
                    COUNT(CASE WHEN ii.INV_ESTADO = 'EXTRAVIADO' THEN 1 END) AS UNIDADES_EXTRAVIADAS
                 FROM ITM i
                 LEFT JOIN INV_ITEMS ii ON i.ITM_CODIGO = ii.ITM_CODIGO
                 LEFT JOIN TALLER t ON i.TAL_CODIGO = t.TAL_CODIGO
                 GROUP BY i.ITM_CODIGO, i.ITM_NOMBRE, i.ITM_DESCRIPCION, i.ITM_CATEGORIA, t.TAL_NOMBRE
                 ORDER BY i.ITM_NOMBRE`
            );
            
            res.json(result.rows);
            
        } catch (err) {
            console.error('Error obteniendo inventario:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Contar items disponibles (usa función PL/SQL)
    router.get('/:codigo/disponibles', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT pkg_inventario.fn_contar_items_disponibles(:itemCodigo) AS CANTIDAD FROM DUAL`,
                { itemCodigo: codigo }
            );

            const cantidad = result.rows[0].CANTIDAD; 
            res.status(200).json({ cantidad: cantidad });

        } catch (err) {
            console.error("Error en fn_contar_items_disponibles:", err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Actualizar estado de item (usa stored procedure)
    router.post('/actualizar-estado', async (req, res) => {
        let connection;
        try {
            const { inv_id, nuevo_estado, observaciones } = req.body;
            connection = await pool.getConnection();

            await connection.execute(
                `BEGIN 
                   pkg_inventario.sp_actualizar_estado_item(
                       :invId, :nuevoEstado, :obs
                   );
                 END;`,
                {
                    invId: inv_id,
                    nuevoEstado: nuevo_estado,
                    obs: observaciones
                },
                { autoCommit: true }
            );
            
            res.status(200).json({ success: true, message: "Estado actualizado exitosamente" });
            
        } catch (err) {
            console.error("Error al actualizar estado:", err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // POST - Registrar item faltante (usa stored procedure)
    router.post('/registrar-faltante', async (req, res) => {
        let connection;
        try {
            const { prestamo_id, inv_id, descripcion, tipo_problema, usuario } = req.body;
            connection = await pool.getConnection();

            await connection.execute(
                `BEGIN
                   pkg_inventario.sp_registrar_item_faltante(
                       :prestamoId, :invId, :descripcion, :tipoProblema, :usuario
                   );
                 END;`,
                {
                    prestamoId: prestamo_id,
                    invId: inv_id,
                    descripcion: descripcion,
                    tipoProblema: tipo_problema,
                    usuario: usuario
                },
                { autoCommit: true }
            );
            
            res.status(200).json({ success: true, message: "Item faltante registrado exitosamente" });
            
        } catch (err) {
            console.error("Error al registrar item faltante:", err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    // GET - Detalle de un item
    router.get('/:codigo', async (req, res) => {
        let connection;
        try {
            const { codigo } = req.params;
            connection = await pool.getConnection();
            
            const result = await connection.execute(
                `SELECT 
                    i.*,
                    t.TAL_NOMBRE AS TALLER_NOMBRE
                 FROM ITM i
                 LEFT JOIN TALLER t ON i.TAL_CODIGO = t.TAL_CODIGO
                 WHERE i.ITM_CODIGO = :codigo`,
                { codigo }
            );
            
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ success: false, message: 'Item no encontrado' });
            }
            
        } catch (err) {
            console.error('Error obteniendo item:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } finally {
            if (connection) await connection.close();
        }
    });

    return router;
};
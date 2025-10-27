// backend/server.js
require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// =============================================
// CONFIGURACIÓN DE ORACLE
// =============================================
const dbConfig = {
    user: process.env.DB_USER || "C##Nicolas",
    password: process.env.DB_PASSWORD || "balu2012",
    connectString: process.env.DB_CONNECT_STRING || "localhost:1521/XE",
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 2,
    poolTimeout: 60
};

// Configuración global de oracledb
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false;

// =============================================
// MIDDLEWARE
// =============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configurado para desarrollo
const allowedOrigins = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://192.168.1.89:8080',  // Tu IP local desde los logs anteriores
    'http://192.168.3.19:8080'   // Tu IP actual
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como Postman) o desde orígenes permitidos
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ Origen bloqueado por CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// =============================================
// FUNCIÓN DE INICIALIZACIÓN DE BD
// =============================================
async function inicializarDB() {
    try {
        const pool = await oracledb.createPool(dbConfig);
        console.log('✅ Pool de conexiones Oracle creado exitosamente');

        // Verificar la conexión
        const connection = await pool.getConnection();
        const result = await connection.execute('SELECT SYSDATE FROM DUAL');
        console.log(`✅ Conexión verificada - Fecha del servidor: ${result.rows[0].SYSDATE}`);

        // Verificar que existen los packages
        const packagesResult = await connection.execute(`
            SELECT object_name, status 
            FROM user_objects 
            WHERE object_type = 'PACKAGE' 
            AND object_name IN ('PKG_GESTION_PRESTAMOS', 'PKG_INVENTARIO')
        `);

        if (packagesResult.rows.length > 0) {
            console.log('✅ Packages PL/SQL encontrados:');
            packagesResult.rows.forEach(pkg => {
                console.log(`   - ${pkg.OBJECT_NAME}: ${pkg.STATUS}`);
            });
        } else {
            console.warn('⚠️  No se encontraron los packages necesarios');
        }

        await connection.close();
        return pool;
    } catch (err) {
        console.error('❌ Error al conectar a Oracle:', err.message);
        throw err;
    }
}

// =============================================
// RUTAS DE LA API
// =============================================
inicializarDB()
    .then(pool => {
        app.locals.pool = pool;

        // Router principal de la API
        const apiRouter = express.Router();

        // Cargar todas las rutas
        apiRouter.use('/dashboard', require('./routes/dashboard')(pool));
        apiRouter.use('/prestamos', require('./routes/prestamos')(pool));
        apiRouter.use('/alumnos', require('./routes/alumnos')(pool));
        apiRouter.use('/inventario', require('./routes/inventario')(pool));
        apiRouter.use('/cajas', require('./routes/cajas')(pool));
        apiRouter.use('/talleres', require('./routes/talleres')(pool));
        apiRouter.use('/reportes', require('./routes/reportes')(pool));
        apiRouter.use('/revision', require('./routes/revision')(pool));

        app.use('/api', apiRouter);

        // =============================================
        // HEALTH CHECK
        // =============================================
        app.get('/api/health', async (req, res) => {
            try {
                const connection = await pool.getConnection();
                await connection.execute('SELECT 1 FROM DUAL');
                await connection.close();

                res.json({
                    status: 'OK',
                    database: 'Connected',
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development'
                });
            } catch (err) {
                res.status(500).json({
                    status: 'ERROR',
                    database: 'Disconnected',
                    error: err.message
                });
            }
        });

        // =============================================
        // AUTENTICACIÓN
        // =============================================
        app.post('/api/login', async (req, res) => {
            const { rut, password } = req.body;
            let connection;

            try {
                connection = await pool.getConnection();

                // Formatear RUT (eliminar puntos y guión)
                const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');

                console.log('🔐 Intento de login con RUT:', rutLimpio);

                // Consultar docente en la base de datos (TABLA: DOCENTES)
                const result = await connection.execute(
                    `SELECT DOC_RUT, DOC_NOMBRE, DOC_APELLIDO, DOC_EMAIL
             FROM DOCENTES 
             WHERE DOC_RUT = :rut AND DOC_ESTADO = 'ACTIVO'`,
                    { rut: rutLimpio }
                );

                console.log('📊 Resultados encontrados:', result.rows.length);

                if (result.rows.length > 0) {
                    const usuario = result.rows[0];
                    console.log('✅ Usuario encontrado:', usuario.DOC_NOMBRE, usuario.DOC_APELLIDO);

                    res.status(200).json({
                        success: true,
                        rut: usuario.DOC_RUT,
                        nombre: `${usuario.DOC_NOMBRE} ${usuario.DOC_APELLIDO}`,
                        email: usuario.DOC_EMAIL,
                        rol: 'DOCENTE',
                        token: 'jwt-token-' + Date.now()
                    });
                } else {
                    console.log('❌ No se encontró el docente');
                    res.status(401).json({
                        success: false,
                        message: 'Credenciales incorrectas o usuario inactivo'
                    });
                }
            } catch (err) {
                console.error('❌ Error en login:', err.message);
                res.status(500).json({
                    success: false,
                    message: 'Error en el servidor: ' + err.message
                });
            } finally {
                if (connection) await connection.close();
            }
        });

        // =============================================
        // SERVIR FRONTEND
        // =============================================
        // Ruta principal redirige al login
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/login.html'));
        });

        // Todas las demás rutas sirven el frontend
        app.get('*', (req, res) => {
            if (!req.path.startsWith('/api')) {
                res.sendFile(path.join(__dirname, '../frontend', req.path));
            }
        });

        // =============================================
        // MANEJO DE ERRORES
        // =============================================
        // 404 para rutas de API no encontradas
        app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint no encontrado'
            });
        });

        // Manejo de errores generales
        app.use((err, req, res, next) => {
            console.error('Error general:', err.stack);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        // =============================================
        // INICIAR SERVIDOR
        // =============================================
        app.listen(port, () => {
            console.log('\n🚀 ========================================');
            console.log(`   SISTEMA DE PAÑOL - COLEGIO NOCEDAL`);
            console.log('   ========================================');
            console.log(`   🌐 Servidor: http://localhost:${port}`);
            console.log(`   🔌 API:      http://localhost:${port}/api`);
            console.log(`   💚 Health:   http://localhost:${port}/api/health`);
            console.log(`   📅 Fecha:    ${new Date().toLocaleString('es-CL')}`);
            console.log('   ========================================\n');
        });

        // =============================================
        // CIERRE GRACEFUL
        // =============================================
        const shutdown = async () => {
            console.log('\n⚠️  Señal de cierre recibida...');
            try {
                await pool.close(10); // 10 segundos de timeout
                console.log('✅ Pool de conexiones cerrado');
                process.exit(0);
            } catch (err) {
                console.error('❌ Error al cerrar pool:', err.message);
                process.exit(1);
            }
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    })
    .catch(err => {
        console.error('❌ Error fatal al inicializar el servidor:', err.message);
        process.exit(1);
    });
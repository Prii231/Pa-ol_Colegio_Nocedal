require('dotenv').config();
const oracledb = require('oracledb');

async function testConnection() {
    console.log('🔍 Probando conexión a Oracle...\n');
    console.log('📋 Configuración actual:');
    console.log('   Usuario:', process.env.DB_USER);
    console.log('   Password:', process.env.DB_PASSWORD.replace(/./g, '*'));
    console.log('   Connection String:', process.env.DB_CONNECT_STRING);
    console.log('');

    try {
        const connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING
        });

        console.log('✅ ¡Conexión exitosa!\n');

        const result = await connection.execute('SELECT SYSDATE, USER FROM DUAL');
        console.log('📅 Fecha del servidor:', result.rows[0][0]);
        console.log('👤 Usuario conectado:', result.rows[0][1]);

        await connection.close();
        console.log('\n✅ Todo funciona correctamente');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error de conexión:\n');
        console.error('   Código:', err.errorNum);
        console.error('   Mensaje:', err.message);
        console.error('\n💡 Sugerencias:');
        
        if (err.message.includes('ORA-01017')) {
            console.error('   1. Verificar usuario y contraseña en .env');
            console.error('   2. Probar manualmente: sqlplus ' + process.env.DB_USER + '/***@' + process.env.DB_CONNECT_STRING);
            console.error('   3. El usuario puede no existir o estar bloqueado');
        } else if (err.message.includes('ORA-12154')) {
            console.error('   1. Verificar el connection string en .env');
            console.error('   2. Verificar que Oracle esté corriendo: lsnrctl status');
        } else if (err.message.includes('ORA-12541')) {
            console.error('   1. Oracle no está corriendo');
            console.error('   2. Verificar: lsnrctl status');
        }
        
        process.exit(1);
    }
}

testConnection();
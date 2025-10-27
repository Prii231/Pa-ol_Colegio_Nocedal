// test-routes.js
require('dotenv').config();
const oracledb = require('oracledb');

async function testRoutes() {
    console.log('🔍 Probando cada archivo de ruta...\n');
    
    const routes = [
        'dashboard',
        'prestamos',
        'alumnos',
        'inventario',
        'cajas',
        'talleres',
        'reportes',
        'revision'
    ];
    
    for (const route of routes) {
        try {
            const routeModule = require(`./routes/${route}`);
            
            if (typeof routeModule === 'function') {
                console.log(`✅ routes/${route}.js - OK (es una función)`);
            } else {
                console.log(`❌ routes/${route}.js - ERROR: No es una función, es: ${typeof routeModule}`);
            }
        } catch (err) {
            console.log(`❌ routes/${route}.js - ERROR: ${err.message}`);
        }
    }
    
    console.log('\n✅ Diagnóstico completado');
}

testRoutes();
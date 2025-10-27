/* =============================================
   DASHBOARD.JS - Página Principal
   Conectado con Backend Node.js + Oracle
   ============================================= */

// =============================================
// CARGAR DATOS DEL DASHBOARD
// =============================================

async function cargarDashboard() {
    await Promise.all([
        cargarMetricas(),
        cargarResumenTalleres(),
        cargarPrestamosRecientes(),
        cargarAlertas()
    ]);
}

// Cargar métricas principales
async function cargarMetricas() {
    try {
        const data = await PanolApp.fetchAPI('/dashboard/metricas');
        
        if (data) {
            document.getElementById('totalCajas').textContent = data.totalCajas || '0';
            document.getElementById('prestamosActivos').textContent = data.prestamosActivos || '0';
            document.getElementById('itemsExtraviados').textContent = data.itemsExtraviados || '0';
            document.getElementById('cajasDisponibles').textContent = data.cajasDisponibles || '0';
        }
    } catch (error) {
        console.error('Error cargando métricas:', error);
        PanolApp.showToast('Error al cargar métricas', 'error');
    }
}

// Cargar resumen por taller
async function cargarResumenTalleres() {
    try {
        const data = await PanolApp.fetchAPI('/dashboard/resumen-talleres');
        
        if (data && data.length > 0) {
            const tbody = document.querySelector('#resumenTalleres tbody');
            if (!tbody) return;
            
            tbody.innerHTML = data.map(taller => `
                <tr>
                    <td>
                        <strong>${taller.TAL_NOMBRE}</strong><br>
                        <small style="color: #666;">${taller.TAL_UBICACION || 'Sin ubicación'}</small>
                    </td>
                    <td>${taller.TOTAL_CAJAS || 0}</td>
                    <td><span class="badge ${getBadgeClass(taller.CAJAS_PRESTADAS, taller.TOTAL_CAJAS)}">${taller.CAJAS_PRESTADAS || 0}</span></td>
                    <td><span class="badge badge-success">${taller.CAJAS_DISPONIBLES || 0}</span></td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${taller.PORCENTAJE_USO || 0}%; ${getProgressColor(taller.PORCENTAJE_USO)}">
                                ${taller.PORCENTAJE_USO || 0}%
                            </div>
                        </div>
                    </td>
                    <td>
                        <button class="btn-icon" title="Ver detalles" onclick="verDetalleTaller('${taller.TAL_CODIGO}')">👁️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando resumen de talleres:', error);
    }
}

// Cargar préstamos recientes
async function cargarPrestamosRecientes() {
    try {
        const data = await PanolApp.fetchAPI('/dashboard/prestamos-recientes');
        
        if (data && data.length > 0) {
            const tbody = document.querySelector('.table-container:last-of-type table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = data.map(prestamo => `
                <tr>
                    <td>${PanolApp.formatearFecha(prestamo.PRE_FECHA_INICIO)}</td>
                    <td>${prestamo.GRUPO}</td>
                    <td><code>${prestamo.CAJ_CODIGO}</code></td>
                    <td>${prestamo.TAL_NOMBRE}</td>
                    <td>${getEstadoBadge(prestamo.PRE_ESTADO)}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando préstamos recientes:', error);
    }
}

// Cargar alertas del sistema
async function cargarAlertas() {
    try {
        const data = await PanolApp.fetchAPI('/dashboard/alertas');
        
        if (data && data.length > 0) {
            const alertasContainer = document.querySelector('.card[style*="border-left"] ul');
            if (!alertasContainer) return;
            
            alertasContainer.innerHTML = data.map(alerta => `
                <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                    ${alerta.mensaje}
                </li>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando alertas:', error);
    }
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function getBadgeClass(prestadas, total) {
    const porcentaje = (prestadas / total) * 100;
    if (porcentaje === 100) return 'badge-danger';
    if (porcentaje >= 80) return 'badge-warning';
    return 'badge-info';
}

function getProgressColor(porcentaje) {
    if (porcentaje >= 100) return 'background-color: #dc3545;';
    if (porcentaje >= 80) return 'background-color: #FFC107;';
    return '';
}

function getEstadoBadge(estado) {
    const badges = {
        'ACTIVO': '<span class="badge badge-success">ACTIVO</span>',
        'DEVUELTO': '<span class="badge badge-info">DEVUELTO</span>',
        'DEVOLUCION_PARCIAL': '<span class="badge badge-warning">DEV. PARCIAL</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

function verDetalleTaller(tallerCodigo) {
    window.location.href = `talleres.html?taller=${tallerCodigo}`;
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard cargando...');
    
    // Cargar datos iniciales
    cargarDashboard();
    
    // Actualizar datos cada 5 minutos
    setInterval(cargarDashboard, 300000);
    
    console.log('✅ Dashboard inicializado');
});
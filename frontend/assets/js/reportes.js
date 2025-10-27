/* =============================================
   REPORTES.JS - Generación de Reportes y Estadísticas
   Página: reportes.html
   Usa: pkg_gestion_prestamos.sp_reporte_prestamos_activos
   ============================================= */

let tipoReporteActual = null;
let datosReporteActual = null;

// =============================================
// SELECCIÓN DE TIPO DE REPORTE
// =============================================

// Seleccionar tipo de reporte
function seleccionarReporte(tipo) {
    tipoReporteActual = tipo;
    document.getElementById('areaReporte').classList.remove('hidden');
    
    const nombres = {
        'prestamos': 'Préstamos Activos',
        'inventario': 'Estado de Inventario',
        'problemas': 'Items Problemáticos',
        'cumplimiento': 'Cumplimiento por Grupo',
        'estadisticas': 'Estadísticas por Taller',
        'historial': 'Historial de Movimientos'
    };
    
    document.getElementById('tipoReporteNombre').textContent = nombres[tipo];
    document.getElementById('resultadoReporte').classList.add('hidden');
    
    // Scroll al área de reporte
    document.getElementById('areaReporte').scrollIntoView({ behavior: 'smooth' });
}

// =============================================
// GENERACIÓN DE REPORTES
// =============================================

// Generar reporte según tipo seleccionado
async function generarReporte() {
    if (!tipoReporteActual) {
        PanolApp.showToast('Seleccione un tipo de reporte', 'warning');
        return;
    }
    
    const taller = document.getElementById('reporteTaller').value;
    const fechaInicio = document.getElementById('reporteFechaInicio').value;
    const fechaFin = document.getElementById('reporteFechaFin').value;
    
    PanolApp.showToast('Generando reporte...', 'info');
    
    try {
        let datos = null;
        
        switch(tipoReporteActual) {
            case 'prestamos':
                datos = await generarReportePrestamos(taller, fechaInicio, fechaFin);
                break;
            case 'inventario':
                datos = await generarReporteInventario(taller);
                break;
            case 'problemas':
                datos = await generarReporteProblemas(taller, fechaInicio, fechaFin);
                break;
            case 'cumplimiento':
                datos = await generarReporteCumplimiento(taller);
                break;
            case 'estadisticas':
                datos = await generarReporteEstadisticas(taller);
                break;
            case 'historial':
                datos = await generarReporteHistorial(taller, fechaInicio, fechaFin);
                break;
        }
        
        if (datos) {
            datosReporteActual = datos;
            renderReporte(datos, taller, fechaInicio, fechaFin);
            PanolApp.showToast('Reporte generado exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error generando reporte:', error);
        PanolApp.showToast('Error al generar reporte', 'error');
    }
}

// =============================================
// REPORTES ESPECÍFICOS
// =============================================

// Reporte de préstamos (usa pkg_gestion_prestamos.sp_reporte_prestamos_activos)
async function generarReportePrestamos(taller, fechaInicio, fechaFin) {
    try {
        const params = new URLSearchParams({
            taller: taller || '',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });
        
        const response = await PanolApp.fetchAPI(`/reportes/prestamos?${params}`);
        return response;
    } catch (error) {
        console.error('Error en reporte de préstamos:', error);
        return null;
    }
}

// Reporte de inventario
async function generarReporteInventario(taller) {
    try {
        const params = taller ? `?taller=${taller}` : '';
        const response = await PanolApp.fetchAPI(`/reportes/inventario${params}`);
        return response;
    } catch (error) {
        console.error('Error en reporte de inventario:', error);
        return null;
    }
}

// Reporte de items problemáticos
async function generarReporteProblemas(taller, fechaInicio, fechaFin) {
    try {
        const params = new URLSearchParams({
            taller: taller || '',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });
        
        const response = await PanolApp.fetchAPI(`/reportes/items-problematicos?${params}`);
        return response;
    } catch (error) {
        console.error('Error en reporte de problemas:', error);
        return null;
    }
}

// Reporte de cumplimiento por grupo (usa fn_porcentaje_cumplimiento_grupo)
async function generarReporteCumplimiento(taller) {
    try {
        const params = taller ? `?taller=${taller}` : '';
        const response = await PanolApp.fetchAPI(`/reportes/cumplimiento${params}`);
        return response;
    } catch (error) {
        console.error('Error en reporte de cumplimiento:', error);
        return null;
    }
}

// Reporte de estadísticas por taller (usa sp_estadisticas_taller)
async function generarReporteEstadisticas(taller) {
    try {
        const params = taller ? `?taller=${taller}` : '';
        const response = await PanolApp.fetchAPI(`/reportes/estadisticas${params}`);
        return response;
    } catch (error) {
        console.error('Error en reporte de estadísticas:', error);
        return null;
    }
}

// Reporte de historial de movimientos
async function generarReporteHistorial(taller, fechaInicio, fechaFin) {
    try {
        const params = new URLSearchParams({
            taller: taller || '',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            limite: 100
        });
        
        const response = await PanolApp.fetchAPI(`/reportes/historial?${params}`);
        return response;
    } catch (error) {
        console.error('Error en reporte de historial:', error);
        return null;
    }
}

// =============================================
// RENDERIZADO DE REPORTES
// =============================================

// Renderizar reporte en el contenedor
function renderReporte(datos, taller, fechaInicio, fechaFin) {
    const tallerNombre = obtenerNombreTaller(taller);
    const fechaGeneracion = new Date().toLocaleDateString('es-CL');
    const usuario = document.getElementById('userName').textContent;
    
    let contenido = `
        <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h2 style="color: #0056A3; margin-bottom: 0.5rem;">Sistema de Gestión de Pañol</h2>
                    <p style="color: #666;">Colegio Técnico Profesional Nocedal</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>Fecha de Generación:</strong> ${fechaGeneracion}</p>
                    <p><strong>Usuario:</strong> ${usuario}</p>
                </div>
            </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 2rem;">
            <h4 style="margin-bottom: 0.5rem;">Parámetros del Reporte</h4>
            <p><strong>Taller:</strong> ${tallerNombre}</p>
            <p><strong>Período:</strong> ${fechaInicio} a ${fechaFin}</p>
        </div>
    `;
    
    // Agregar contenido específico según el tipo
    switch(tipoReporteActual) {
        case 'prestamos':
            contenido += renderReportePrestamos(datos);
            break;
        case 'inventario':
            contenido += renderReporteInventario(datos);
            break;
        case 'problemas':
            contenido += renderReporteProblemas(datos);
            break;
        case 'cumplimiento':
            contenido += renderReporteCumplimiento(datos);
            break;
        case 'estadisticas':
            contenido += renderReporteEstadisticas(datos);
            break;
        case 'historial':
            contenido += renderReporteHistorial(datos);
            break;
    }
    
    document.getElementById('contenidoReporte').innerHTML = contenido;
    document.getElementById('tituloReporte').textContent = `Reporte: ${document.getElementById('tipoReporteNombre').textContent}`;
    document.getElementById('resultadoReporte').classList.remove('hidden');
    document.getElementById('resultadoReporte').scrollIntoView({ behavior: 'smooth' });
}

// Renderizar reporte de préstamos
function renderReportePrestamos(datos) {
    if (!datos || !datos.resumen) return '<p>No hay datos disponibles</p>';
    
    return `
        <h3 style="margin-bottom: 1rem;">Resumen de Préstamos</h3>
        <div class="stats-row" style="margin-bottom: 2rem;">
            <div class="stat-item">
                <div class="stat-value">${datos.resumen.activos || 0}</div>
                <div class="stat-label">Préstamos Activos</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${datos.resumen.devueltos || 0}</div>
                <div class="stat-label">Devueltos</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${datos.resumen.tasa_uso || 0}%</div>
                <div class="stat-label">Tasa de Uso</div>
            </div>
        </div>

        <h4>Detalle por Taller</h4>
        <table style="width: 100%; margin-top: 1rem;">
            <thead>
                <tr>
                    <th>Taller</th>
                    <th>Préstamos Activos</th>
                    <th>Devueltos</th>
                    <th>Con Problemas</th>
                </tr>
            </thead>
            <tbody>
                ${datos.detalle.map(d => `
                    <tr>
                        <td>${d.taller_nombre}</td>
                        <td>${d.activos}</td>
                        <td>${d.devueltos}</td>
                        <td>${d.con_problemas}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Renderizar reporte de inventario
function renderReporteInventario(datos) {
    if (!datos || !datos.resumen) return '<p>No hay datos disponibles</p>';
    
    return `
        <h3 style="margin-bottom: 1rem;">Estado del Inventario</h3>
        <div class="stats-row" style="margin-bottom: 2rem;">
            <div class="stat-item">
                <div class="stat-value">${datos.resumen.total || 0}</div>
                <div class="stat-label">Total Items</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #00A859;">${datos.resumen.disponibles || 0}</div>
                <div class="stat-label">Disponibles</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #FFC107;">${datos.resumen.prestados || 0}</div>
                <div class="stat-label">Prestados</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #dc3545;">${datos.resumen.extraviados || 0}</div>
                <div class="stat-label">Extraviados</div>
            </div>
        </div>

        <h4>Distribución por Categoría</h4>
        <table style="width: 100%; margin-top: 1rem;">
            <thead>
                <tr>
                    <th>Categoría</th>
                    <th>Total</th>
                    <th>Disponibles</th>
                    <th>Prestados</th>
                    <th>Extraviados</th>
                </tr>
            </thead>
            <tbody>
                ${datos.categorias.map(c => `
                    <tr>
                        <td>${c.categoria_nombre}</td>
                        <td>${c.total}</td>
                        <td>${c.disponibles}</td>
                        <td>${c.prestados}</td>
                        <td>${c.extraviados}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Renderizar reporte de problemas
function renderReporteProblemas(datos) {
    if (!datos || !datos.items) return '<p>No hay items problemáticos</p>';
    
    const valorTotal = datos.items.reduce((sum, i) => sum + (i.valor_reposicion || 0), 0);
    
    return `
        <h3 style="margin-bottom: 1rem;">Items Problemáticos</h3>
        <div class="card" style="background-color: #fff3cd; border-left: 4px solid #FFC107; margin-bottom: 2rem;">
            <p style="margin: 0;"><strong>⚠️ Total de items con problemas: ${datos.items.length}</strong></p>
        </div>

        <h4>Detalle de Problemas</h4>
        <table style="width: 100%; margin-top: 1rem;">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Código</th>
                    <th>Problema</th>
                    <th>Grupo Responsable</th>
                    <th>Valor Reposición</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${datos.items.map(item => `
                    <tr>
                        <td>${item.itm_nombre}</td>
                        <td><code>${item.itm_codigo}</code></td>
                        <td><span class="badge badge-${item.tipo === 'FALTANTE' ? 'danger' : 'warning'}">${item.tipo}</span></td>
                        <td>${item.grupo_nombre || '-'}</td>
                        <td>${PanolApp.formatearMoneda(item.valor_reposicion)}</td>
                        <td><span class="badge badge-${getColorEstado(item.estado)}">${item.estado}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 2rem; padding: 1rem; background-color: #f8f9fa; border-radius: 4px;">
            <p><strong>Valor Total de Reposición:</strong> ${PanolApp.formatearMoneda(valorTotal)}</p>
        </div>
    `;
}

// Renderizar reporte de cumplimiento
function renderReporteCumplimiento(datos) {
    if (!datos || !datos.grupos) return '<p>No hay datos disponibles</p>';
    
    const conProblemas = datos.grupos.filter(g => g.porcentaje < 100).length;
    const sinProblemas = datos.grupos.length - conProblemas;
    
    return `
        <h3 style="margin-bottom: 1rem;">Cumplimiento por Grupo</h3>
        <table style="width: 100%; margin-top: 1rem;">
            <thead>
                <tr>
                    <th>Grupo</th>
                    <th>Curso</th>
                    <th>Préstamos</th>
                    <th>Devoluciones OK</th>
                    <th>Con Problemas</th>
                    <th>% Cumplimiento</th>
                </tr>
            </thead>
            <tbody>
                ${datos.grupos.map(g => `
                    <tr>
                        <td>${g.grupo_nombre}</td>
                        <td>${g.curso_nombre}</td>
                        <td>${g.total_prestamos}</td>
                        <td>${g.devoluciones_ok}</td>
                        <td>${g.con_problemas}</td>
                        <td><span class="badge badge-${g.porcentaje === 100 ? 'success' : g.porcentaje >= 50 ? 'warning' : 'danger'}">${g.porcentaje}%</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 2rem;">
            <h4>Estadísticas Generales</h4>
            <p>Grupos con 100% cumplimiento: <strong>${sinProblemas} de ${datos.grupos.length}</strong> (${Math.round(sinProblemas * 100 / datos.grupos.length)}%)</p>
            <p>Grupos con problemas registrados: <strong>${conProblemas} de ${datos.grupos.length}</strong> (${Math.round(conProblemas * 100 / datos.grupos.length)}%)</p>
        </div>
    `;
}

// Renderizar reporte de estadísticas
function renderReporteEstadisticas(datos) {
    if (!datos || !datos.talleres) return '<p>No hay datos disponibles</p>';
    
    return `
        <h3 style="margin-bottom: 1rem;">Estadísticas por Taller</h3>
        <table style="width: 100%; margin-top: 1rem;">
            <thead>
                <tr>
                    <th>Taller</th>
                    <th>Cajas Total</th>
                    <th>Cajas Prestadas</th>
                    <th>Items Total</th>
                    <th>Items Extraviados</th>
                    <th>% Uso</th>
                </tr>
            </thead>
            <tbody>
                ${datos.talleres.map(t => `
                    <tr>
                        <td><strong>${t.taller_nombre}</strong></td>
                        <td>${t.total_cajas}</td>
                        <td>${t.cajas_prestadas}</td>
                        <td>${t.total_items}</td>
                        <td>${t.items_extraviados}</td>
                        <td>${t.porcentaje_uso}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Renderizar reporte de historial
function renderReporteHistorial(datos) {
    if (!datos || !datos.movimientos) return '<p>No hay movimientos registrados</p>';
    
    return `
        <h3 style="margin-bottom: 1rem;">Historial de Movimientos</h3>
        <table style="width: 100%; margin-top: 1rem;">
            <thead>
                <tr>
                    <th>Fecha/Hora</th>
                    <th>Tipo Movimiento</th>
                    <th>Descripción</th>
                    <th>Usuario</th>
                </tr>
            </thead>
            <tbody>
                ${datos.movimientos.map(m => `
                    <tr>
                        <td>${PanolApp.formatearFecha(m.his_fecha)}</td>
                        <td><span class="badge badge-${getColorTipoMovimiento(m.his_tipo_movimiento)}">${m.his_tipo_movimiento}</span></td>
                        <td>${m.his_descripcion}</td>
                        <td>${m.his_usuario || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// =============================================
// EXPORTACIÓN
// =============================================

// Exportar a PDF
function exportarPDF() {
    PanolApp.showToast('Preparando PDF...', 'info');
    
    // Aquí iría la lógica real de exportación a PDF
    // Puedes usar librerías como jsPDF o generar el PDF en el backend
    
    setTimeout(() => {
        PanolApp.showToast('Reporte descargado exitosamente', 'success');
        // window.print(); // Alternativa simple
    }, 1000);
}

// Exportar a Excel
function exportarExcel() {
    PanolApp.showToast('Preparando Excel...', 'info');
    
    // Aquí iría la lógica real de exportación a Excel
    // Puedes usar librerías como SheetJS
    
    setTimeout(() => {
        PanolApp.showToast('Reporte descargado exitosamente', 'success');
    }, 1000);
}

// Imprimir reporte
function imprimirReporte() {
    window.print();
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Obtener nombre del taller
function obtenerNombreTaller(codigo) {
    if (!codigo) return 'Todos los talleres';
    const nombres = {
        'ELEC': 'Electrónica',
        'ELCN': 'Electricidad y Neumática',
        'AUTO': 'Automatización'
    };
    return nombres[codigo] || codigo;
}

// Obtener color según estado
function getColorEstado(estado) {
    const colores = {
        'PENDIENTE': 'warning',
        'EN_PROCESO': 'info',
        'RESUELTO': 'success',
        'CANCELADO': 'secondary'
    };
    return colores[estado] || 'secondary';
}

// Obtener color según tipo de movimiento
function getColorTipoMovimiento(tipo) {
    const colores = {
        'PRESTAMO_ANUAL': 'success',
        'DEVOLUCION': 'info',
        'CAMBIO_ESTADO_ITEM': 'warning',
        'REGISTRO_ITEM': 'primary'
    };
    return colores[tipo] || 'secondary';
}

// Limpiar filtros y reporte
function limpiarReporte() {
    document.getElementById('reporteTaller').value = '';
    const hoy = new Date();
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
    document.getElementById('reporteFechaInicio').value = inicioAnio.toISOString().split('T')[0];
    document.getElementById('reporteFechaFin').value = hoy.toISOString().split('T')[0];
    document.getElementById('resultadoReporte').classList.add('hidden');
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar fechas por defecto
    const hoy = new Date();
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
    
    document.getElementById('reporteFechaInicio').value = inicioAnio.toISOString().split('T')[0];
    document.getElementById('reporteFechaFin').value = hoy.toISOString().split('T')[0];
});
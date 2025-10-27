/* =============================================
   PRESTAMOS.JS - Gestión de Préstamos Anuales
   Página: prestamos.html
   Usa: pkg_gestion_prestamos.sp_asignar_caja_anual
   ============================================= */

let prestamosData = [];
let gruposSinPrestamoData = [];
let cajasDisponiblesData = [];

// =============================================
// CARGAR DATOS
// =============================================

// Cargar préstamos
async function cargarPrestamos() {
    try {
        const anio = document.getElementById('filtroAnio').value || new Date().getFullYear();
        const response = await PanolApp.fetchAPI(`/prestamos?anio=${anio}`);
        if (response) {
            prestamosData = response;
            renderPrestamosTable(prestamosData);
        }
    } catch (error) {
        console.error('Error cargando préstamos:', error);
        PanolApp.showToast('Error al cargar préstamos', 'error');
    }
}

// Cargar grupos sin préstamo
async function cargarGruposSinPrestamo() {
    try {
        const anio = new Date().getFullYear();
        const response = await PanolApp.fetchAPI(`/grupos/sin-prestamo?anio=${anio}`);
        if (response) {
            gruposSinPrestamoData = response;
            renderGruposSinPrestamo();
        }
    } catch (error) {
        console.error('Error cargando grupos sin préstamo:', error);
    }
}

// Cargar cajas disponibles por taller
async function cargarCajasDisponibles() {
    const grupoSelect = document.getElementById('prestamoGrupo');
    if (!grupoSelect || !grupoSelect.value) return;
    
    const selectedOption = grupoSelect.options[grupoSelect.selectedIndex];
    const taller = selectedOption.getAttribute('data-taller');
    
    try {
        const response = await PanolApp.fetchAPI(`/cajas/disponibles?taller=${taller}`);
        if (response) {
            cajasDisponiblesData = response;
            llenarSelectCajas();
        }
    } catch (error) {
        console.error('Error cargando cajas:', error);
    }
}

// =============================================
// RENDERIZADO
// =============================================

// Renderizar tabla de préstamos
function renderPrestamosTable(prestamos) {
    const tbody = document.querySelector('#prestamosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = prestamos.map(prestamo => `
        <tr data-id="${prestamo.pre_id}">
            <td><strong>#${String(prestamo.pre_id).padStart(3, '0')}</strong></td>
            <td>${prestamo.grupo_nombre}</td>
            <td><code>${prestamo.caj_codigo}</code></td>
            <td>${prestamo.taller_nombre}</td>
            <td>${PanolApp.formatearFecha(prestamo.pre_fecha_inicio)}</td>
            <td>${PanolApp.formatearFecha(prestamo.pre_fecha_fin)}</td>
            <td>${prestamo.docente_nombre || '-'}</td>
            <td>${getEstadoPrestamoBadge(prestamo.pre_estado)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Ver detalles" onclick="verDetallePrestamo(${prestamo.pre_id})">👁️</button>
                    <button class="btn-icon" title="Ver grupo" onclick="verGrupoPrestamo(${prestamo.gru_id})">👥</button>
                    ${prestamo.pre_estado === 'ACTIVO' ? 
                        `<button class="btn-icon" title="Procesar devolución" onclick="procesarDevolucion(${prestamo.pre_id})">↩️</button>` :
                        `<button class="btn-icon" title="Ver reporte" onclick="verReportePrestamo(${prestamo.pre_id})">📄</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Obtener badge de estado de préstamo
function getEstadoPrestamoBadge(estado) {
    const badges = {
        'ACTIVO': '<span class="badge badge-success">ACTIVO</span>',
        'DEVUELTO': '<span class="badge badge-info">DEVUELTO</span>',
        'DEVOLUCION_PARCIAL': '<span class="badge badge-warning">DEVOLUCIÓN PARCIAL</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

// Renderizar grupos sin préstamo
function renderGruposSinPrestamo() {
    const tbody = document.querySelector('.card tbody');
    if (!tbody || !gruposSinPrestamoData.length) return;
    
    tbody.innerHTML = gruposSinPrestamoData.map(grupo => `
        <tr>
            <td>${grupo.gru_nombre}</td>
            <td>${grupo.curso_nombre}</td>
            <td>${grupo.taller_nombre}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="asignarPrestamoRapido(${grupo.gru_id}, '${grupo.tal_codigo}')">
                    Asignar Caja
                </button>
            </td>
        </tr>
    `).join('');
}

// Llenar select de cajas disponibles
function llenarSelectCajas() {
    const select = document.getElementById('prestamoCaja');
    const infoText = document.getElementById('cajasDisponiblesInfo');
    
    if (select) {
        if (cajasDisponiblesData.length === 0) {
            select.innerHTML = '<option value="">No hay cajas disponibles</option>';
            if (infoText) infoText.textContent = 'No hay cajas disponibles para este taller';
        } else {
            select.innerHTML = '<option value="">Seleccione una caja...</option>' +
                cajasDisponiblesData.map(caja => 
                    `<option value="${caja.caj_codigo}">${caja.caj_codigo} - Caja #${caja.caj_numero}</option>`
                ).join('');
            if (infoText) infoText.textContent = `${cajasDisponiblesData.length} cajas disponibles`;
        }
    }
}

// =============================================
// GESTIÓN DE PRÉSTAMOS (Usa Package PL/SQL)
// =============================================

// Registrar préstamo anual (llama a pkg_gestion_prestamos.sp_asignar_caja_anual)
async function registrarPrestamo(formData) {
    const grupoId = formData.get('prestamoGrupo');
    const cajaCodigo = formData.get('prestamoCaja');
    const docenteRut = formData.get('prestamoDocenteRut');
    const observaciones = formData.get('prestamoObservaciones');
    
    // Validar RUT del docente
    if (!PanolApp.validarRut(docenteRut)) {
        PanolApp.showToast('RUT del docente inválido', 'error');
        document.getElementById('prestamoDocenteRut').focus();
        return;
    }
    
    // Validar que la caja esté disponible
    const cajaDisponible = await verificarDisponibilidadCaja(cajaCodigo);
    if (!cajaDisponible) {
        PanolApp.showToast('La caja seleccionada no está disponible', 'error');
        return;
    }
    
    // Validar que el grupo no tenga préstamo activo
    const grupoPrestamo = await verificarGrupoSinPrestamo(grupoId);
    if (!grupoPrestamo) {
        PanolApp.showToast('El grupo ya tiene un préstamo activo', 'error');
        return;
    }
    
    try {
        // Llamar al endpoint que ejecuta el package PL/SQL
        const response = await PanolApp.fetchAPI('/prestamos/asignar-caja-anual', 'POST', {
            p_grupo_id: grupoId,
            p_caja_codigo: cajaCodigo,
            p_docente_rut: docenteRut.replace(/\./g, '').replace(/-/g, ''),
            p_anio: new Date().getFullYear(),
            observaciones: observaciones
        });
        
        if (response) {
            PanolApp.showToast('Préstamo registrado exitosamente', 'success');
            PanolApp.closeModal('prestamoModal');
            cargarPrestamos();
            cargarGruposSinPrestamo();
        }
    } catch (error) {
        console.error('Error registrando préstamo:', error);
        
        // Manejar errores específicos del PL/SQL
        if (error.message.includes('-20001')) {
            PanolApp.showToast('La caja no está disponible', 'error');
        } else if (error.message.includes('-20002')) {
            PanolApp.showToast('El grupo ya tiene un préstamo activo', 'error');
        } else {
            PanolApp.showToast('Error al registrar préstamo', 'error');
        }
    }
}

// Verificar si la caja está disponible (usa pkg_gestion_prestamos.fn_caja_disponible)
async function verificarDisponibilidadCaja(cajaCodigo) {
    try {
        const response = await PanolApp.fetchAPI(`/cajas/${cajaCodigo}/disponible`);
        return response && response.disponible === true;
    } catch (error) {
        console.error('Error verificando caja:', error);
        return false;
    }
}

// Verificar que el grupo no tenga préstamo activo (usa pkg_gestion_prestamos.fn_grupo_tiene_prestamo)
async function verificarGrupoSinPrestamo(grupoId) {
    try {
        const anio = new Date().getFullYear();
        const response = await PanolApp.fetchAPI(`/grupos/${grupoId}/tiene-prestamo?anio=${anio}`);
        return response && response.tiene_prestamo === false;
    } catch (error) {
        console.error('Error verificando grupo:', error);
        return false;
    }
}

// Ver detalles del préstamo
async function verDetallePrestamo(prestamoId) {
    try {
        const response = await PanolApp.fetchAPI(`/prestamos/${prestamoId}`);
        if (response) {
            document.getElementById('detPrestamoId').textContent = prestamoId;
            document.getElementById('detGrupo').textContent = response.grupo_nombre;
            document.getElementById('detCaja').textContent = response.caj_codigo;
            document.getElementById('detTaller').textContent = response.taller_nombre;
            document.getElementById('detFechaInicio').textContent = PanolApp.formatearFecha(response.pre_fecha_inicio);
            document.getElementById('detFechaFin').textContent = PanolApp.formatearFecha(response.pre_fecha_fin);
            document.getElementById('detEstado').innerHTML = getEstadoPrestamoBadge(response.pre_estado);
            document.getElementById('detDocente').textContent = response.docente_nombre;
            document.getElementById('detObservaciones').textContent = response.pre_observaciones_prestamo || 'Sin observaciones';
            
            // Cargar integrantes del grupo
            const integrantes = await PanolApp.fetchAPI(`/grupos/${response.gru_id}/integrantes`);
            if (integrantes) {
                const lista = integrantes.map(i => 
                    `<li>${i.alu_nombres} ${i.alu_apellidos}${i.ing_rol === 'RESPONSABLE' ? ' - Responsable' : ''}</li>`
                ).join('');
                document.getElementById('detIntegrantes').innerHTML = lista;
            }
            
            PanolApp.openModal('detallePrestamoModal');
        }
    } catch (error) {
        console.error('Error obteniendo detalles:', error);
    }
}

// Procesar devolución (redirige a revision.html)
function procesarDevolucion(prestamoId) {
    if (confirm('¿Desea procesar la devolución de este préstamo?')) {
        window.location.href = `revision.html?prestamo=${prestamoId}`;
    }
}

// Ver grupo del préstamo
function verGrupoPrestamo(grupoId) {
    window.location.href = `talleres.html?grupo=${grupoId}`;
}

// Ver reporte de préstamo devuelto
function verReportePrestamo(prestamoId) {
    window.location.href = `reportes.html?prestamo=${prestamoId}`;
}

// Asignación rápida desde grupos sin préstamo
function asignarPrestamoRapido(grupoId, tallerCodigo) {
    // Pre-seleccionar el grupo
    const grupoSelect = document.getElementById('prestamoGrupo');
    if (grupoSelect) {
        // Buscar la opción del grupo
        for (let i = 0; i < grupoSelect.options.length; i++) {
            if (grupoSelect.options[i].value == grupoId) {
                grupoSelect.selectedIndex = i;
                break;
            }
        }
        
        // Cargar cajas disponibles
        cargarCajasDisponibles();
    }
    
    PanolApp.openModal('prestamoModal');
}

// =============================================
// FILTROS Y BÚSQUEDA
// =============================================

// Aplicar filtros
function aplicarFiltros() {
    const taller = document.getElementById('filtroTaller').value;
    const estado = document.getElementById('filtroEstado').value;
    const anio = document.getElementById('filtroAnio').value;
    
    let prestamosFiltrados = [...prestamosData];
    
    if (taller) {
        prestamosFiltrados = prestamosFiltrados.filter(p => p.tal_codigo === taller);
    }
    
    if (estado) {
        prestamosFiltrados = prestamosFiltrados.filter(p => p.pre_estado === estado);
    }
    
    renderPrestamosTable(prestamosFiltrados);
    PanolApp.showToast(`${prestamosFiltrados.length} préstamos encontrados`, 'info');
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarPrestamos();
    cargarGruposSinPrestamo();
    
    // Event listener del formulario
    const prestamoForm = document.getElementById('prestamoForm');
    if (prestamoForm) {
        prestamoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            registrarPrestamo(formData);
        });
    }
    
    // Formatear RUT mientras se escribe
    const rutInput = document.getElementById('prestamoDocenteRut');
    if (rutInput) {
        rutInput.addEventListener('input', function(e) {
            e.target.value = PanolApp.formatearRut(e.target.value);
        });
    }
    
    // Cargar cajas cuando cambia el grupo
    const grupoSelect = document.getElementById('prestamoGrupo');
    if (grupoSelect) {
        grupoSelect.addEventListener('change', function(e) {
            if (e.target.value) {
                cargarCajasDisponibles();
            } else {
                document.getElementById('prestamoCaja').innerHTML = '<option value="">Primero seleccione un grupo...</option>';
            }
        });
    }
    
    // Verificar si viene con parámetro de grupo en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const grupoParam = urlParams.get('grupo');
    if (grupoParam) {
        asignarPrestamoRapido(grupoParam);
    }
});
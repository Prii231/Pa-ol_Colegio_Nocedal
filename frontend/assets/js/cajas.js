/* =============================================
   CAJAS.JS - Gestión de Cajas de Herramientas
   Página: cajas.html
   ============================================= */

let cajasData = [];
let composicionEstandarData = {};

// =============================================
// CARGAR DATOS
// =============================================

// Cargar todas las cajas
async function cargarCajas() {
    try {
        const response = await PanolApp.fetchAPI('/cajas');
        if (response) {
            cajasData = response;
            renderCajasTable(cajasData);
            actualizarResumenTalleres();
        }
    } catch (error) {
        console.error('Error cargando cajas:', error);
        PanolApp.showToast('Error al cargar cajas', 'error');
    }
}

// Cargar composición estándar por taller
async function cargarComposicionEstandar(tallerCodigo) {
    try {
        const response = await PanolApp.fetchAPI(`/composicion-estandar/${tallerCodigo}`);
        if (response) {
            composicionEstandarData[tallerCodigo] = response;
            return response;
        }
    } catch (error) {
        console.error('Error cargando composición:', error);
        return [];
    }
}

// =============================================
// RENDERIZADO
// =============================================

// Renderizar tabla de cajas
function renderCajasTable(cajas) {
    const tbody = document.querySelector('#cajasTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = cajas.map(caja => `
        <tr data-codigo="${caja.caj_codigo}">
            <td><strong>${caja.caj_codigo}</strong></td>
            <td>${caja.caj_numero}</td>
            <td>${caja.taller_nombre}</td>
            <td>
                ${caja.curso_asignado ? 
                    caja.curso_asignado : 
                    '<span class="badge badge-secondary">Sin asignar</span>'
                }
            </td>
            <td>${getEstadoCajaBadge(caja.caj_estado)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${caja.completitud}%; background-color: ${getColorCompletitud(caja.completitud)}">
                        ${caja.completitud}%
                    </div>
                </div>
            </td>
            <td>${caja.caj_candado_numero || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Ver contenido" onclick="verContenidoCaja('${caja.caj_codigo}')">📦</button>
                    <button class="btn-icon" title="Editar" onclick="editarCaja('${caja.caj_codigo}')">✏️</button>
                    <button class="btn-icon" title="Historial" onclick="verHistorialCaja('${caja.caj_codigo}')">📋</button>
                    ${caja.completitud < 100 ? 
                        `<button class="btn-icon" title="Completar caja" onclick="completarCaja('${caja.caj_codigo}')">➕</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Obtener badge de estado de caja
function getEstadoCajaBadge(estado) {
    const badges = {
        'DISPONIBLE': '<span class="badge badge-success">DISPONIBLE</span>',
        'PRESTADO': '<span class="badge badge-warning">PRESTADO</span>',
        'MANTENIMIENTO': '<span class="badge badge-info">MANTENIMIENTO</span>',
        'EXTRAVIADO': '<span class="badge badge-danger">EXTRAVIADO</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

// Obtener color según completitud
function getColorCompletitud(porcentaje) {
    if (porcentaje === 100) return '#00A859';
    if (porcentaje >= 90) return '#FFC107';
    return '#dc3545';
}

// Actualizar resumen por talleres
function actualizarResumenTalleres() {
    const talleres = ['ELEC', 'ELCN', 'AUTO'];
    
    talleres.forEach((taller, index) => {
        const cajasTaller = cajasData.filter(c => c.tal_codigo === taller);
        const total = cajasTaller.length;
        const prestadas = cajasTaller.filter(c => c.caj_estado === 'PRESTADO').length;
        const disponibles = total - prestadas;
        
        // Actualizar cards de resumen
        const cards = document.querySelectorAll('.card');
        if (cards[index]) {
            const stats = cards[index].querySelectorAll('.stat-value');
            if (stats.length >= 2) {
                stats[0].textContent = prestadas;
                stats[1].textContent = disponibles;
            }
        }
    });
}

// =============================================
// CRUD DE CAJAS
// =============================================

// Guardar caja
async function guardarCaja(formData) {
    const tallerCodigo = formData.get('cajaTaller');
    const numero = formData.get('cajaNumero');
    
    const caja = {
        caj_codigo: `CAJ-${tallerCodigo}-${String(numero).padStart(3, '0')}`,
        caj_numero: numero,
        caj_nombre: formData.get('cajaNombre') || `Caja ${tallerCodigo} #${numero}`,
        caj_descripcion: formData.get('cajaDescripcion'),
        tal_codigo: tallerCodigo,
        caj_estado: 'DISPONIBLE',
        caj_ubicacion: formData.get('cajaUbicacion') || 'PAÑOL',
        caj_candado_numero: formData.get('cajaCandado')
    };
    
    try {
        const response = await PanolApp.fetchAPI('/cajas', 'POST', caja);
        
        if (response) {
            // Si se marcó "armar con composición estándar"
            const conItems = document.getElementById('cajaConItems').checked;
            if (conItems) {
                await armarCajaConComposicion(caja.caj_codigo, tallerCodigo);
            }
            
            PanolApp.showToast('Caja creada exitosamente', 'success');
            PanolApp.closeModal('cajaModal');
            cargarCajas();
        }
    } catch (error) {
        console.error('Error guardando caja:', error);
        PanolApp.showToast('Error al guardar caja', 'error');
    }
}

// Armar caja con composición estándar
async function armarCajaConComposicion(cajaCodigo, tallerCodigo) {
    try {
        // Obtener composición estándar
        const composicion = await cargarComposicionEstandar(tallerCodigo);
        
        if (!composicion || composicion.length === 0) {
            PanolApp.showToast('No hay composición estándar definida para este taller', 'warning');
            return;
        }
        
        // Por cada item de la composición, buscar unidades disponibles y asignarlas
        for (const comp of composicion) {
            const cantidad = comp.com_cantidad;
            
            // Buscar unidades disponibles del item
            const unidades = await buscarUnidadesDisponibles(comp.itm_codigo, cantidad);
            
            // Asignar cada unidad a la caja
            for (const unidad of unidades) {
                await asignarItemACaja(cajaCodigo, unidad.inv_id);
            }
        }
        
        PanolApp.showToast('Caja armada con composición estándar', 'success');
    } catch (error) {
        console.error('Error armando caja:', error);
        PanolApp.showToast('Error al armar caja', 'error');
    }
}

// Buscar unidades disponibles de un item
async function buscarUnidadesDisponibles(itemCodigo, cantidad) {
    try {
        const response = await PanolApp.fetchAPI(`/inventario/${itemCodigo}/unidades-disponibles?cantidad=${cantidad}`);
        return response || [];
    } catch (error) {
        console.error('Error buscando unidades:', error);
        return [];
    }
}

// Asignar item a caja
async function asignarItemACaja(cajaCodigo, invId) {
    try {
        await PanolApp.fetchAPI('/cajas/items', 'POST', {
            caj_codigo: cajaCodigo,
            inv_id: invId,
            iec_cantidad: 1
        });
    } catch (error) {
        console.error('Error asignando item:', error);
    }
}

// Editar caja
function editarCaja(codigo) {
    const caja = cajasData.find(c => c.caj_codigo === codigo);
    if (!caja) return;
    
    document.getElementById('cajaTaller').value = caja.tal_codigo;
    document.getElementById('cajaNumero').value = caja.caj_numero;
    document.getElementById('cajaNombre').value = caja.caj_nombre;
    document.getElementById('cajaCandado').value = caja.caj_candado_numero || '';
    document.getElementById('cajaUbicacion').value = caja.caj_ubicacion || '';
    document.getElementById('cajaDescripcion').value = caja.caj_descripcion || '';
    
    // Ocultar opción de armar con composición en edición
    const checkboxGroup = document.getElementById('cajaConItems').closest('.form-group');
    if (checkboxGroup) checkboxGroup.style.display = 'none';
    
    document.querySelector('#cajaModal .modal-title').textContent = 'Editar Caja';
    PanolApp.openModal('cajaModal');
}

// Ver contenido de la caja
async function verContenidoCaja(cajaCodigo) {
    try {
        const response = await PanolApp.fetchAPI(`/cajas/${cajaCodigo}/contenido`);
        
        if (response) {
            const caja = cajasData.find(c => c.caj_codigo === cajaCodigo);
            
            document.getElementById('contCodigo').textContent = cajaCodigo;
            document.getElementById('contTaller').textContent = caja.taller_nombre;
            document.getElementById('contEstado').innerHTML = getEstadoCajaBadge(caja.caj_estado);
            
            // Renderizar contenido
            const tbody = document.getElementById('contenidoCajaBody');
            tbody.innerHTML = response.map(item => `
                <tr>
                    <td>${item.itm_nombre}</td>
                    <td><code>${item.inv_codigo_interno}</code></td>
                    <td>${getEstadoBadge(item.inv_estado)}</td>
                    <td>${getCondicionBadge(item.inv_condicion)}</td>
                </tr>
            `).join('');
            
            PanolApp.openModal('contenidoModal');
        }
    } catch (error) {
        console.error('Error obteniendo contenido:', error);
        PanolApp.showToast('Error al cargar contenido', 'error');
    }
}

function getEstadoBadge(estado) {
    const badges = {
        'DISPONIBLE': '<span class="badge badge-success">DISPONIBLE</span>',
        'PRESTADO': '<span class="badge badge-warning">PRESTADO</span>',
        'EXTRAVIADO': '<span class="badge badge-danger">EXTRAVIADO</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

function getCondicionBadge(condicion) {
    const badges = {
        'BUENO': '<span class="badge badge-success">BUENO</span>',
        'REGULAR': '<span class="badge badge-warning">REGULAR</span>',
        'MALO': '<span class="badge badge-danger">MALO</span>'
    };
    return badges[condicion] || '<span class="badge badge-secondary">-</span>';
}

// Ver historial de la caja
async function verHistorialCaja(cajaCodigo) {
    try {
        const response = await PanolApp.fetchAPI(`/cajas/${cajaCodigo}/historial`);
        if (response && response.length > 0) {
            const historial = response.map(h => 
                `${PanolApp.formatearFecha(h.his_fecha)}: ${h.his_descripcion}`
            ).join('\n');
            
            alert(`Historial de la Caja:\n\n${historial}`);
        } else {
            alert('No hay historial registrado para esta caja');
        }
    } catch (error) {
        console.error('Error obteniendo historial:', error);
    }
}

// Completar caja faltante
async function completarCaja(cajaCodigo) {
    const caja = cajasData.find(c => c.caj_codigo === cajaCodigo);
    if (!caja) return;
    
    try {
        // Obtener composición estándar y contenido actual
        const composicion = await cargarComposicionEstandar(caja.tal_codigo);
        const contenido = await PanolApp.fetchAPI(`/cajas/${cajaCodigo}/contenido`);
        
        // Determinar qué items faltan
        const itemsFaltantes = [];
        for (const comp of composicion) {
            const cantidadActual = contenido.filter(i => i.itm_codigo === comp.itm_codigo).length;
            const cantidadRequerida = comp.com_cantidad;
            
            if (cantidadActual < cantidadRequerida) {
                itemsFaltantes.push({
                    codigo: comp.itm_codigo,
                    nombre: comp.itm_nombre,
                    cantidad: cantidadRequerida - cantidadActual
                });
            }
        }
        
        if (itemsFaltantes.length === 0) {
            PanolApp.showToast('La caja ya está completa', 'info');
            return;
        }
        
        // Mostrar items faltantes
        const mensaje = `Items faltantes:\n${itemsFaltantes.map(i => `- ${i.nombre}: ${i.cantidad}`).join('\n')}\n\n¿Desea completar automáticamente?`;
        
        if (confirm(mensaje)) {
            // Completar con unidades disponibles
            for (const item of itemsFaltantes) {
                const unidades = await buscarUnidadesDisponibles(item.codigo, item.cantidad);
                for (const unidad of unidades) {
                    await asignarItemACaja(cajaCodigo, unidad.inv_id);
                }
            }
            
            PanolApp.showToast('Caja completada exitosamente', 'success');
            cargarCajas();
        }
    } catch (error) {
        console.error('Error completando caja:', error);
        PanolApp.showToast('Error al completar caja', 'error');
    }
}

// =============================================
// COMPOSICIÓN ESTÁNDAR
// =============================================

// Ver composición estándar por taller
async function verComposicionEstandar() {
    // Cargar composiciones de todos los talleres
    await cargarComposicionEstandar('ELEC');
    await cargarComposicionEstandar('ELCN');
    await cargarComposicionEstandar('AUTO');
    
    // Renderizar tabs
    renderComposicionEstandar('ELEC', 0);
    
    PanolApp.openModal('composicionModal');
}

// Renderizar composición estándar
function renderComposicionEstandar(tallerCodigo, tabIndex) {
    const composicion = composicionEstandarData[tallerCodigo] || [];
    const tabContent = document.querySelectorAll('#composicionModal .tab-content')[tabIndex];
    
    if (tabContent) {
        tabContent.innerHTML = `
            <table style="width: 100%; margin-top: 1rem;">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Cantidad</th>
                        <th>Obligatorio</th>
                    </tr>
                </thead>
                <tbody>
                    ${composicion.map(item => `
                        <tr>
                            <td>${item.itm_nombre}</td>
                            <td>${item.com_cantidad}</td>
                            <td>
                                ${item.com_obligatorio === 'S' ? 
                                    '<span class="badge badge-success">Sí</span>' : 
                                    '<span class="badge badge-secondary">No</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

// =============================================
// FILTROS Y BÚSQUEDA
// =============================================

// Aplicar filtros
function aplicarFiltros() {
    const taller = document.getElementById('filtroTaller').value;
    const estado = document.getElementById('filtroEstado').value;
    const completitud = document.getElementById('filtroCompletitud').value;
    
    let cajasFiltradas = [...cajasData];
    
    if (taller) {
        cajasFiltradas = cajasFiltradas.filter(c => c.tal_codigo === taller);
    }
    
    if (estado) {
        cajasFiltradas = cajasFiltradas.filter(c => c.caj_estado === estado);
    }
    
    if (completitud === 'COMPLETA') {
        cajasFiltradas = cajasFiltradas.filter(c => c.completitud === 100);
    } else if (completitud === 'INCOMPLETA') {
        cajasFiltradas = cajasFiltradas.filter(c => c.completitud < 100);
    }
    
    renderCajasTable(cajasFiltradas);
    PanolApp.showToast(`${cajasFiltradas.length} cajas encontradas`, 'info');
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarCajas();
    
    // Configurar búsqueda
    PanolApp.setupTableSearch('searchCajas', 'cajasTable');
    
    // Event listener del formulario
    const cajaForm = document.getElementById('cajaForm');
    if (cajaForm) {
        cajaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            guardarCaja(formData);
        });
    }
    
    // Limpiar formulario al abrir modal
    const cajaModal = document.getElementById('cajaModal');
    if (cajaModal) {
        cajaModal.addEventListener('click', function(e) {
            if (e.target === this) {
                const form = cajaForm;
                if (form) {
                    form.reset();
                    const checkboxGroup = document.getElementById('cajaConItems').closest('.form-group');
                    if (checkboxGroup) checkboxGroup.style.display = '';
                    document.querySelector('#cajaModal .modal-title').textContent = 'Nueva Caja de Herramientas';
                }
            }
        });
    }
});
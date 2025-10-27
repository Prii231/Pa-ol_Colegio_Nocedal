/* =============================================
   INVENTARIO.JS - Gestión de Inventario
   Página: inventario.html
   ============================================= */

let inventarioData = [];
let categoriasData = [];
let tiposItemData = [];

// =============================================
// CARGAR DATOS
// =============================================

// Cargar inventario completo
async function cargarInventario() {
    try {
        const response = await PanolApp.fetchAPI('/inventario');
        if (response) {
            inventarioData = response;
            renderInventarioTable(inventarioData);
            actualizarEstadisticasInventario();
        }
    } catch (error) {
        console.error('Error cargando inventario:', error);
        PanolApp.showToast('Error al cargar inventario', 'error');
    }
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const response = await PanolApp.fetchAPI('/categorias');
        if (response) {
            categoriasData = response;
            llenarSelectCategorias();
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Cargar tipos de items
async function cargarTiposItem(categoriaId = null) {
    try {
        const url = categoriaId ? `/tipos-item?categoria=${categoriaId}` : '/tipos-item';
        const response = await PanolApp.fetchAPI(url);
        if (response) {
            tiposItemData = response;
        }
    } catch (error) {
        console.error('Error cargando tipos de item:', error);
    }
}

// Llenar select de categorías
function llenarSelectCategorias() {
    const select = document.getElementById('itemCategoria');
    const filtro = document.getElementById('filtroCategoria');
    
    if (select) {
        select.innerHTML = '<option value="">Seleccione...</option>' +
            categoriasData.map(cat => 
                `<option value="${cat.cat_codigo}">${cat.cat_nombre}</option>`
            ).join('');
    }
    
    if (filtro) {
        filtro.innerHTML = '<option value="">Todas</option>' +
            categoriasData.map(cat => 
                `<option value="${cat.cat_codigo}">${cat.cat_nombre}</option>`
            ).join('');
    }
}

// =============================================
// RENDERIZADO
// =============================================

// Renderizar tabla de inventario
function renderInventarioTable(items) {
    const tbody = document.querySelector('#inventarioTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = items.map(item => `
        <tr data-codigo="${item.itm_codigo}">
            <td><strong>${item.itm_codigo}</strong></td>
            <td>${item.itm_nombre} ${item.itm_modelo ? `- ${item.itm_modelo}` : ''}</td>
            <td>${getCategoriaBadge(item.categoria_nombre)}</td>
            <td>${item.taller_nombre || '-'}</td>
            <td>${getEstadoBadge(item.inv_estado)}</td>
            <td>${getCondicionBadge(item.inv_condicion)}</td>
            <td>${PanolApp.formatearMoneda(item.itm_valor_reposicion)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Ver detalles" onclick="verDetalleItem('${item.itm_codigo}')">👁️</button>
                    <button class="btn-icon" title="Editar" onclick="editarItem('${item.itm_codigo}')">✏️</button>
                    <button class="btn-icon" title="Historial" onclick="verHistorialItem('${item.itm_codigo}')">📋</button>
                    ${item.inv_estado === 'EXTRAVIADO' ? 
                        `<button class="btn-icon" title="Reportar hallazgo" onclick="reportarHallazgo('${item.itm_codigo}')">🔍</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Obtener badge de categoría
function getCategoriaBadge(categoria) {
    const colores = {
        'Herramientas': 'info',
        'Instrumentos': 'warning',
        'EPP': 'success',
        'Componentes': 'primary',
        'Materiales': 'secondary',
        'Seguridad': 'danger'
    };
    const color = colores[categoria] || 'secondary';
    return `<span class="badge badge-${color}">${categoria}</span>`;
}

// Obtener badge de estado
function getEstadoBadge(estado) {
    const badges = {
        'DISPONIBLE': '<span class="badge badge-success">DISPONIBLE</span>',
        'PRESTADO': '<span class="badge badge-warning">PRESTADO</span>',
        'EXTRAVIADO': '<span class="badge badge-danger">EXTRAVIADO</span>',
        'MANTENIMIENTO': '<span class="badge badge-info">MANTENIMIENTO</span>',
        'BAJA': '<span class="badge badge-secondary">BAJA</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

// Obtener badge de condición
function getCondicionBadge(condicion) {
    const badges = {
        'BUENO': '<span class="badge badge-success">BUENO</span>',
        'REGULAR': '<span class="badge badge-warning">REGULAR</span>',
        'MALO': '<span class="badge badge-danger">MALO</span>'
    };
    return badges[condicion] || '<span class="badge badge-secondary">-</span>';
}

// Actualizar estadísticas
function actualizarEstadisticasInventario() {
    const total = inventarioData.length;
    const disponibles = inventarioData.filter(i => i.inv_estado === 'DISPONIBLE').length;
    const prestados = inventarioData.filter(i => i.inv_estado === 'PRESTADO').length;
    const extraviados = inventarioData.filter(i => i.inv_estado === 'EXTRAVIADO').length;
    
    const stats = document.querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = total;
        stats[1].textContent = disponibles;
        stats[2].textContent = prestados;
        stats[3].textContent = extraviados;
    }
}

// =============================================
// CRUD DE ITEMS
// =============================================

// Guardar item
async function guardarItem(formData) {
    const cantidad = parseInt(formData.get('itemCantidad')) || 1;
    
    const itemBase = {
        itm_nombre: formData.get('itemNombre'),
        itm_modelo: formData.get('itemModelo'),
        itm_marca: formData.get('itemMarca'),
        cat_id: formData.get('itemCategoria'),
        tal_codigo: formData.get('itemTaller'),
        itm_valor_reposicion: formData.get('itemValor'),
        itm_caracteristicas: formData.get('itemCaracteristicas')
    };
    
    try {
        // Crear el item maestro
        const response = await PanolApp.fetchAPI('/inventario', 'POST', itemBase);
        
        if (response && response.itm_codigo) {
            // Crear las unidades individuales en inventario_items
            for (let i = 1; i <= cantidad; i++) {
                const itemIndividual = {
                    itm_codigo: response.itm_codigo,
                    inv_numero_serie: formData.get('itemSerie') || null,
                    inv_codigo_interno: `${response.itm_codigo}-${String(i).padStart(2, '0')}`,
                    inv_estado: 'DISPONIBLE',
                    inv_condicion: 'BUENO',
                    inv_ubicacion: 'PAÑOL',
                    inv_fecha_adquisicion: new Date().toISOString().split('T')[0]
                };
                
                await PanolApp.fetchAPI('/inventario/unidades', 'POST', itemIndividual);
            }
            
            PanolApp.showToast(`${cantidad} item(s) registrado(s) exitosamente`, 'success');
            PanolApp.closeModal('itemModal');
            cargarInventario();
        }
    } catch (error) {
        console.error('Error guardando item:', error);
        PanolApp.showToast('Error al guardar item', 'error');
    }
}

// Ver detalles del item
async function verDetalleItem(codigo) {
    try {
        const response = await PanolApp.fetchAPI(`/inventario/${codigo}`);
        if (response) {
            document.getElementById('detalleCodigo').textContent = response.itm_codigo;
            document.getElementById('detalleNombre').textContent = response.itm_nombre;
            document.getElementById('detalleModelo').textContent = response.itm_modelo || '-';
            document.getElementById('detalleMarca').textContent = response.itm_marca || '-';
            document.getElementById('detalleCategoria').textContent = response.categoria_nombre;
            document.getElementById('detalleTaller').textContent = response.taller_nombre;
            document.getElementById('detalleEstado').innerHTML = getEstadoBadge(response.inv_estado);
            document.getElementById('detalleValor').textContent = PanolApp.formatearMoneda(response.itm_valor_reposicion);
            document.getElementById('detalleCaracteristicas').textContent = response.itm_caracteristicas || '-';
            document.getElementById('detalleUbicacion').textContent = response.inv_ubicacion || '-';
            document.getElementById('detalleFecha').textContent = PanolApp.formatearFecha(response.inv_fecha_adquisicion);
            
            PanolApp.openModal('detalleItemModal');
        }
    } catch (error) {
        console.error('Error obteniendo detalles:', error);
    }
}

// Editar item
function editarItem(codigo) {
    const item = inventarioData.find(i => i.itm_codigo === codigo);
    if (!item) return;
    
    document.getElementById('itemNombre').value = item.itm_nombre;
    document.getElementById('itemModelo').value = item.itm_modelo || '';
    document.getElementById('itemMarca').value = item.itm_marca || '';
    document.getElementById('itemCategoria').value = item.cat_id;
    document.getElementById('itemTaller').value = item.tal_codigo;
    document.getElementById('itemValor').value = item.itm_valor_reposicion || '';
    document.getElementById('itemCaracteristicas').value = item.itm_caracteristicas || '';
    
    // Ocultar campo de cantidad en edición
    const cantidadGroup = document.getElementById('itemCantidad').closest('.form-group');
    if (cantidadGroup) cantidadGroup.style.display = 'none';
    
    document.querySelector('#itemModal .modal-title').textContent = 'Editar Item';
    PanolApp.openModal('itemModal');
}

// Actualizar estado del item usando el package PL/SQL
async function actualizarEstadoItem(invId, nuevoEstado, observaciones = null) {
    try {
        const response = await PanolApp.fetchAPI('/inventario/actualizar-estado', 'POST', {
            inv_id: invId,
            nuevo_estado: nuevoEstado,
            observaciones: observaciones
        });
        
        if (response) {
            PanolApp.showToast('Estado actualizado exitosamente', 'success');
            cargarInventario();
        }
    } catch (error) {
        console.error('Error actualizando estado:', error);
        PanolApp.showToast('Error al actualizar estado', 'error');
    }
}

// Ver historial del item
async function verHistorialItem(codigo) {
    try {
        const response = await PanolApp.fetchAPI(`/inventario/${codigo}/historial`);
        if (response && response.length > 0) {
            const historial = response.map(h => 
                `${PanolApp.formatearFecha(h.his_fecha)}: ${h.his_descripcion}`
            ).join('\n');
            
            alert(`Historial del Item:\n\n${historial}`);
        } else {
            alert('No hay historial registrado para este item');
        }
    } catch (error) {
        console.error('Error obteniendo historial:', error);
    }
}

// Reportar hallazgo de item extraviado
async function reportarHallazgo(codigo) {
    if (!confirm('¿Confirma que este item ha sido encontrado?')) return;
    
    try {
        const item = inventarioData.find(i => i.itm_codigo === codigo);
        if (item && item.inv_id) {
            await actualizarEstadoItem(item.inv_id, 'DISPONIBLE', 'Item encontrado y devuelto');
        }
    } catch (error) {
        console.error('Error reportando hallazgo:', error);
    }
}

// =============================================
// FILTROS Y BÚSQUEDA
// =============================================

// Aplicar filtros
function aplicarFiltros() {
    const taller = document.getElementById('filtroTaller').value;
    const estado = document.getElementById('filtroEstado').value;
    const condicion = document.getElementById('filtroCondicion').value;
    
    let itemsFiltrados = [...inventarioData];
    
    if (taller) {
        itemsFiltrados = itemsFiltrados.filter(i => i.tal_codigo === taller);
    }
    
    if (estado) {
        itemsFiltrados = itemsFiltrados.filter(i => i.inv_estado === estado);
    }
    
    if (condicion) {
        itemsFiltrados = itemsFiltrados.filter(i => i.inv_condicion === condicion);
    }
    
    renderInventarioTable(itemsFiltrados);
    PanolApp.showToast(`${itemsFiltrados.length} items encontrados`, 'info');
}

// Filtrar por categoría usando tabs
function filtrarPorCategoria(categoria) {
    if (categoria === 'todos') {
        renderInventarioTable(inventarioData);
    } else {
        const itemsFiltrados = inventarioData.filter(i => 
            i.categoria_codigo === categoria
        );
        renderInventarioTable(itemsFiltrados);
    }
}

// =============================================
// FUNCIONES ADICIONALES
// =============================================

// Contar items disponibles (usando función PL/SQL)
async function contarItemsDisponibles(codigoItem) {
    try {
        const response = await PanolApp.fetchAPI(`/inventario/${codigoItem}/disponibles`);
        return response ? response.cantidad : 0;
    } catch (error) {
        console.error('Error contando items:', error);
        return 0;
    }
}

// Dar de baja item
async function darDeBajaItem(invId) {
    if (!confirm('¿Está seguro de dar de baja este item? Esta acción es irreversible.')) return;
    
    const motivo = prompt('Ingrese el motivo de la baja:');
    if (!motivo) return;
    
    try {
        await actualizarEstadoItem(invId, 'BAJA', motivo);
    } catch (error) {
        console.error('Error dando de baja:', error);
    }
}

// Registrar item faltante (usando package PL/SQL)
async function registrarItemFaltante(prestamoId, invId, descripcion, alumnoRut = null) {
    try {
        const response = await PanolApp.fetchAPI('/inventario/registrar-faltante', 'POST', {
            pre_id: prestamoId,
            inv_id: invId,
            descripcion: descripcion,
            alu_rut: alumnoRut
        });
        
        if (response) {
            PanolApp.showToast('Item faltante registrado', 'warning');
        }
    } catch (error) {
        console.error('Error registrando item faltante:', error);
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarInventario();
    cargarCategorias();
    cargarTiposItem();
    
    // Configurar búsqueda
    PanolApp.setupTableSearch('searchInventario', 'inventarioTable');
    
    // Event listener del formulario
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            guardarItem(formData);
        });
    }
    
    // Cargar tipos de item cuando cambia la categoría
    const categoriaSelect = document.getElementById('itemCategoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', function(e) {
            if (e.target.value) {
                cargarTiposItem(e.target.value);
            }
        });
    }
    
    // Limpiar formulario al abrir modal
    const itemModal = document.getElementById('itemModal');
    if (itemModal) {
        itemModal.addEventListener('click', function(e) {
            if (e.target === this) {
                const form = itemForm;
                if (form) {
                    form.reset();
                    const cantidadGroup = document.getElementById('itemCantidad').closest('.form-group');
                    if (cantidadGroup) cantidadGroup.style.display = '';
                    document.querySelector('#itemModal .modal-title').textContent = 'Nuevo Item';
                }
            }
        });
    }
});
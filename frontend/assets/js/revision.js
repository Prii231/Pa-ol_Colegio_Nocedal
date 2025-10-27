/* =============================================
   REVISION.JS - Revisión y Devolución de Cajas
   Página: revision.html
   Usa: pkg_gestion_prestamos.sp_devolver_caja
   ============================================= */

let prestamoActual = null;
let itemsChecklist = [];
let estadoRevision = {
    presentes: 0,
    faltantes: 0,
    danados: 0,
    itemsProblematicos: []
};

// =============================================
// CARGAR DATOS DEL PRÉSTAMO
// =============================================

// Cargar información del préstamo
async function cargarRevision() {
    const select = document.getElementById('selectPrestamo');
    const selectedOption = select.options[select.selectedIndex];
    
    if (!select.value) {
        document.getElementById('paso2').classList.add('hidden');
        document.getElementById('paso3').classList.add('hidden');
        return;
    }
    
    const prestamoId = select.value;
    
    try {
        // Cargar datos del préstamo
        const prestamo = await PanolApp.fetchAPI(`/prestamos/${prestamoId}`);
        if (!prestamo) {
            PanolApp.showToast('Error al cargar préstamo', 'error');
            return;
        }
        
        prestamoActual = prestamo;
        
        // Mostrar información del préstamo
        document.getElementById('infoGrupo').textContent = prestamo.grupo_nombre;
        document.getElementById('infoCaja').textContent = prestamo.caj_codigo;
        document.getElementById('infoFechaPrestamo').textContent = PanolApp.formatearFecha(prestamo.pre_fecha_inicio);
        
        // Cargar integrantes del grupo
        const integrantes = await PanolApp.fetchAPI(`/grupos/${prestamo.gru_id}/integrantes`);
        if (integrantes) {
            const lista = integrantes.map(i => 
                `<li>${i.alu_nombres} ${i.alu_apellidos}${i.ing_rol === 'RESPONSABLE' ? ' (Responsable)' : ''}</li>`
            ).join('');
            document.getElementById('infoIntegrantes').innerHTML = lista;
        }
        
        document.getElementById('paso2').classList.remove('hidden');
        
        // Cargar checklist de items
        await cargarChecklistItems(prestamo.caj_codigo);
        document.getElementById('paso3').classList.remove('hidden');
        
        PanolApp.showToast('Préstamo cargado. Puede iniciar la revisión', 'info');
    } catch (error) {
        console.error('Error cargando revisión:', error);
        PanolApp.showToast('Error al cargar el préstamo', 'error');
    }
}

// Cargar checklist de items de la caja
async function cargarChecklistItems(cajaCodigo) {
    try {
        const response = await PanolApp.fetchAPI(`/cajas/${cajaCodigo}/contenido`);
        if (response) {
            itemsChecklist = response.map(item => ({
                id: item.inv_id,
                nombre: item.itm_nombre,
                codigoInterno: item.inv_codigo_interno,
                presente: true,
                condicion: 'BUENO',
                observaciones: ''
            }));
            
            renderChecklist();
        }
    } catch (error) {
        console.error('Error cargando items:', error);
        PanolApp.showToast('Error al cargar items de la caja', 'error');
    }
}

// =============================================
// RENDERIZADO DEL CHECKLIST
// =============================================

// Renderizar checklist de items
function renderChecklist() {
    const tbody = document.getElementById('checklistBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    itemsChecklist.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">
                <span style="font-size: 1.2rem;" id="icon-${item.id}">⏳</span>
            </td>
            <td><strong>${item.nombre}</strong></td>
            <td><code>${item.codigoInterno}</code></td>
            <td style="text-align: center;">
                <input type="checkbox" id="presente-${item.id}" onchange="actualizarRevision()" checked>
            </td>
            <td>
                <select id="condicion-${item.id}" onchange="actualizarRevision()">
                    <option value="BUENO">Bueno</option>
                    <option value="REGULAR">Regular</option>
                    <option value="MALO">Malo/Dañado</option>
                </select>
            </td>
            <td>
                <input type="text" id="obs-${item.id}" placeholder="Observaciones..." 
                    style="width: 100%; padding: 0.5rem;"
                    onchange="actualizarRevision()">
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    actualizarRevision();
}

// Actualizar estado de la revisión
function actualizarRevision() {
    let presentes = 0;
    let faltantes = 0;
    let danados = 0;
    let revisados = 0;
    const problemas = [];
    
    itemsChecklist.forEach(item => {
        const presenteCheck = document.getElementById(`presente-${item.id}`);
        const condicionSelect = document.getElementById(`condicion-${item.id}`);
        const obsInput = document.getElementById(`obs-${item.id}`);
        const icon = document.getElementById(`icon-${item.id}`);
        
        if (presenteCheck && condicionSelect) {
            const estaPresente = presenteCheck.checked;
            const condicion = condicionSelect.value;
            const observaciones = obsInput ? obsInput.value : '';
            
            // Actualizar estado del item
            item.presente = estaPresente;
            item.condicion = condicion;
            item.observaciones = observaciones;
            
            if (estaPresente) {
                presentes++;
                if (condicion === 'MALO') {
                    danados++;
                    icon.textContent = '⚠️';
                    icon.parentElement.parentElement.style.backgroundColor = '#fff3cd';
                    problemas.push({
                        inv_id: item.id,
                        item: item.nombre,
                        tipo: 'DAÑADO',
                        obs: observaciones || 'Item en mal estado'
                    });
                } else if (condicion === 'REGULAR') {
                    icon.textContent = '⚠️';
                    icon.parentElement.parentElement.style.backgroundColor = '#fff9e6';
                } else {
                    icon.textContent = '✅';
                    icon.parentElement.parentElement.style.backgroundColor = '';
                }
            } else {
                faltantes++;
                icon.textContent = '❌';
                icon.parentElement.parentElement.style.backgroundColor = '#f8d7da';
                problemas.push({
                    inv_id: item.id,
                    item: item.nombre,
                    tipo: 'FALTANTE',
                    obs: observaciones || 'Item no devuelto'
                });
            }
            revisados++;
        }
    });
    
    // Actualizar resumen
    document.getElementById('resumenPresentes').textContent = presentes;
    document.getElementById('resumenFaltantes').textContent = faltantes;
    document.getElementById('resumenDanados').textContent = danados;
    document.getElementById('contadorItems').textContent = `${revisados} de ${itemsChecklist.length} revisados`;
    
    estadoRevision = { presentes, faltantes, danados, itemsProblematicos: problemas };
    
    // Mostrar problemas
    if (problemas.length > 0) {
        const seccionProblemas = document.getElementById('seccionProblemas');
        const listaProblemas = document.getElementById('listaProblemas');
        seccionProblemas.classList.remove('hidden');
        
        listaProblemas.innerHTML = problemas.map(p => `
            <div style="padding: 0.75rem; background-color: white; border-radius: 4px; margin-bottom: 0.5rem; border-left: 3px solid ${p.tipo === 'FALTANTE' ? '#dc3545' : '#FFC107'}">
                <strong>${p.item}</strong> - ${p.tipo}<br>
                <small style="color: #666;">${p.obs}</small>
            </div>
        `).join('');
    } else {
        document.getElementById('seccionProblemas').classList.add('hidden');
    }
}

// =============================================
// FINALIZAR DEVOLUCIÓN
// =============================================

// Finalizar devolución (llama a pkg_gestion_prestamos.sp_devolver_caja)
function finalizarDevolucion() {
    // Validar docente
    const docenteRut = document.getElementById('docenteRecibe').value;
    if (!docenteRut || !PanolApp.validarRut(docenteRut)) {
        PanolApp.showToast('Debe ingresar un RUT válido del docente que recibe', 'error');
        document.getElementById('docenteRecibe').focus();
        return;
    }
    
    // Mostrar modal de confirmación
    document.getElementById('confPresentes').textContent = estadoRevision.presentes;
    document.getElementById('confFaltantes').textContent = estadoRevision.faltantes;
    document.getElementById('confDanados').textContent = estadoRevision.danados;
    
    let estadoFinal = 'DEVUELTO';
    if (estadoRevision.faltantes > 0 || estadoRevision.danados > 0) {
        estadoFinal = 'DEVUELTO CON OBSERVACIONES';
    }
    document.getElementById('confEstadoFinal').innerHTML = `<span class="badge badge-warning">${estadoFinal}</span>`;
    
    PanolApp.openModal('confirmarDevolucionModal');
}

// Confirmar devolución final
async function confirmarDevolucionFinal() {
    if (!prestamoActual) {
        PanolApp.showToast('No hay préstamo seleccionado', 'error');
        return;
    }
    
    PanolApp.closeModal('confirmarDevolucionModal');
    PanolApp.showToast('Procesando devolución...', 'info');
    
    const docenteRut = document.getElementById('docenteRecibe').value;
    const observaciones = document.getElementById('observacionesDevolucion').value;
    
    try {
        // Preparar datos de la revisión
        const revisionItems = itemsChecklist.map(item => ({
            inv_id: item.id,
            presente: item.presente ? 'S' : 'N',
            condicion: item.condicion,
            observaciones: item.observaciones,
            requiere_reposicion: !item.presente || item.condicion === 'MALO' ? 'S' : 'N'
        }));
        
        // Llamar al endpoint que ejecuta sp_devolver_caja
        const response = await PanolApp.fetchAPI('/prestamos/devolver-caja', 'POST', {
            p_prestamo_id: prestamoActual.pre_id,
            p_docente_rut: docenteRut.replace(/\./g, '').replace(/-/g, ''),
            p_observaciones: observaciones,
            items_revision: revisionItems
        });
        
        if (response) {
            // Registrar items problemáticos
            for (const problema of estadoRevision.itemsProblematicos) {
                await registrarItemProblematico(problema);
            }
            
            PanolApp.showToast('Devolución registrada exitosamente', 'success');
            
            // Redirigir a préstamos después de un momento
            setTimeout(() => {
                window.location.href = 'prestamos.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error procesando devolución:', error);
        PanolApp.showToast('Error al procesar la devolución', 'error');
    }
}

// Registrar item problemático (usa pkg_inventario.sp_registrar_item_faltante)
async function registrarItemProblematico(problema) {
    try {
        await PanolApp.fetchAPI('/inventario/registrar-item-faltante', 'POST', {
            pre_id: prestamoActual.pre_id,
            inv_id: problema.inv_id,
            descripcion: problema.obs,
            tipo_problema: problema.tipo,
            alu_rut_responsable: null // Se puede asignar al responsable del grupo si se desea
        });
    } catch (error) {
        console.error('Error registrando item problemático:', error);
    }
}

// =============================================
// OTRAS FUNCIONES
// =============================================

// Cancelar revisión
function cancelarRevision() {
    if (confirm('¿Está seguro de cancelar la revisión? Se perderán los datos ingresados.')) {
        document.getElementById('selectPrestamo').value = '';
        document.getElementById('paso2').classList.add('hidden');
        document.getElementById('paso3').classList.add('hidden');
        prestamoActual = null;
        itemsChecklist = [];
        PanolApp.showToast('Revisión cancelada', 'info');
    }
}

// Guardar borrador
async function guardarBorrador() {
    if (!prestamoActual) {
        PanolApp.showToast('No hay préstamo seleccionado', 'error');
        return;
    }
    
    try {
        // Guardar estado actual en localStorage o base de datos
        const borrador = {
            prestamo_id: prestamoActual.pre_id,
            fecha: new Date().toISOString(),
            items: itemsChecklist,
            estadoRevision: estadoRevision
        };
        
        localStorage.setItem(`borrador_revision_${prestamoActual.pre_id}`, JSON.stringify(borrador));
        PanolApp.showToast('Borrador guardado exitosamente', 'success');
    } catch (error) {
        console.error('Error guardando borrador:', error);
        PanolApp.showToast('Error al guardar borrador', 'error');
    }
}

// Cargar borrador guardado
function cargarBorrador(prestamoId) {
    try {
        const borradorStr = localStorage.getItem(`borrador_revision_${prestamoId}`);
        if (borradorStr) {
            const borrador = JSON.parse(borradorStr);
            
            if (confirm('Se encontró un borrador guardado. ¿Desea cargarlo?')) {
                itemsChecklist = borrador.items;
                estadoRevision = borrador.estadoRevision;
                
                renderChecklist();
                
                // Restaurar valores de los inputs
                itemsChecklist.forEach(item => {
                    const presenteCheck = document.getElementById(`presente-${item.id}`);
                    const condicionSelect = document.getElementById(`condicion-${item.id}`);
                    const obsInput = document.getElementById(`obs-${item.id}`);
                    
                    if (presenteCheck) presenteCheck.checked = item.presente;
                    if (condicionSelect) condicionSelect.value = item.condicion;
                    if (obsInput) obsInput.value = item.observaciones;
                });
                
                actualizarRevision();
                PanolApp.showToast('Borrador cargado', 'success');
            }
        }
    } catch (error) {
        console.error('Error cargando borrador:', error);
    }
}

// Marcar todos como presentes
function marcarTodosPresentes() {
    itemsChecklist.forEach(item => {
        const presenteCheck = document.getElementById(`presente-${item.id}`);
        if (presenteCheck) presenteCheck.checked = true;
    });
    actualizarRevision();
    PanolApp.showToast('Todos los items marcados como presentes', 'info');
}

// Marcar todos con buena condición
function marcarTodosBuenos() {
    itemsChecklist.forEach(item => {
        const condicionSelect = document.getElementById(`condicion-${item.id}`);
        if (condicionSelect) condicionSelect.value = 'BUENO';
    });
    actualizarRevision();
    PanolApp.showToast('Todos los items marcados en buena condición', 'info');
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Formatear RUT mientras se escribe
    const rutInput = document.getElementById('docenteRecibe');
    if (rutInput) {
        rutInput.addEventListener('input', function(e) {
            e.target.value = PanolApp.formatearRut(e.target.value);
        });
    }
    
    // Verificar si viene con parámetro de préstamo en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const prestamoParam = urlParams.get('prestamo');
    if (prestamoParam) {
        document.getElementById('selectPrestamo').value = prestamoParam;
        cargarRevision();
        
        // Intentar cargar borrador
        setTimeout(() => {
            cargarBorrador(prestamoParam);
        }, 1000);
    }
    
    // Auto-guardar cada 2 minutos
    setInterval(() => {
        if (prestamoActual && itemsChecklist.length > 0) {
            guardarBorrador();
        }
    }, 120000); // 2 minutos
});
/* =============================================
   ALUMNOS.JS - Gestión de Alumnos
   Página: alumnos.html
   ============================================= */

let alumnosData = [];
let cursosDisponibles = [];
let gruposDisponibles = [];

// =============================================
// CARGAR DATOS
// =============================================

// Cargar todos los alumnos
async function cargarAlumnos() {
    try {
        const response = await PanolApp.fetchAPI('/alumnos');
        if (response) {
            alumnosData = response;
            renderAlumnosTable(alumnosData);
            actualizarEstadisticas();
        }
    } catch (error) {
        console.error('Error cargando alumnos:', error);
        PanolApp.showToast('Error al cargar alumnos', 'error');
    }
}

// Cargar cursos disponibles
async function cargarCursosDisponibles() {
    try {
        const response = await PanolApp.fetchAPI('/cursos');
        if (response) {
            cursosDisponibles = response;
            llenarSelectCursos();
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
    }
}

// Llenar select de cursos
function llenarSelectCursos() {
    const selectCurso = document.getElementById('alumnoCurso');
    const filtroCurso = document.getElementById('filtroCurso');
    
    if (selectCurso) {
        selectCurso.innerHTML = '<option value="">Seleccione...</option>' +
            cursosDisponibles.map(curso => 
                `<option value="${curso.cur_codigo}">${curso.cur_nivel} ${curso.cur_letra} - ${curso.taller_nombre}</option>`
            ).join('');
    }
    
    if (filtroCurso) {
        filtroCurso.innerHTML = '<option value="">Todos</option>' +
            cursosDisponibles.map(curso => 
                `<option value="${curso.cur_codigo}">${curso.cur_nivel} ${curso.cur_letra}</option>`
            ).join('');
    }
}

// Cargar grupos de un curso
async function cargarGruposPorCurso(curCodigo) {
    try {
        const response = await PanolApp.fetchAPI(`/cursos/${curCodigo}/grupos`);
        if (response) {
            gruposDisponibles = response;
            llenarSelectGrupos();
        }
    } catch (error) {
        console.error('Error cargando grupos:', error);
    }
}

// Llenar select de grupos
function llenarSelectGrupos() {
    const selectGrupo = document.getElementById('alumnoGrupo');
    if (selectGrupo) {
        selectGrupo.innerHTML = '<option value="">Sin asignar</option>' +
            gruposDisponibles.map(grupo => {
                const integrantes = grupo.cantidad_integrantes || 0;
                const disponible = integrantes < 3;
                return `<option value="${grupo.gru_id}" ${!disponible ? 'disabled' : ''}>
                    Grupo ${grupo.gru_numero} (${integrantes}/3 integrantes)
                </option>`;
            }).join('');
    }
}

// =============================================
// RENDERIZADO
// =============================================

// Renderizar tabla de alumnos
function renderAlumnosTable(alumnos) {
    const tbody = document.getElementById('alumnosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = alumnos.map(alumno => `
        <tr data-rut="${alumno.alu_rut}">
            <td>${PanolApp.formatearRut(alumno.alu_rut)}</td>
            <td><strong>${alumno.alu_nombres} ${alumno.alu_apellidos}</strong></td>
            <td>${alumno.alu_email || '-'}</td>
            <td>${alumno.curso_nombre || '-'}</td>
            <td>${alumno.grupo_nombre || '<span class="badge badge-secondary">Sin grupo</span>'}</td>
            <td>${getEstadoBadge(alumno.alu_estado)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Editar" onclick="editarAlumno('${alumno.alu_rut}')">✏️</button>
                    <button class="btn-icon" title="Ver historial" onclick="verHistorialAlumno('${alumno.alu_rut}')">📄</button>
                    <button class="btn-icon" title="Cambiar grupo" onclick="cambiarGrupoAlumno('${alumno.alu_rut}')">↔️</button>
                    ${alumno.alu_estado === 'INACTIVO' ? 
                        `<button class="btn-icon" title="Reactivar" onclick="cambiarEstadoAlumno('${alumno.alu_rut}', 'ACTIVO')">🔄</button>` :
                        `<button class="btn-icon" title="Desactivar" onclick="cambiarEstadoAlumno('${alumno.alu_rut}', 'INACTIVO')">⏸️</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Obtener badge según estado
function getEstadoBadge(estado) {
    const badges = {
        'ACTIVO': '<span class="badge badge-success">ACTIVO</span>',
        'INACTIVO': '<span class="badge badge-warning">INACTIVO</span>',
        'EGRESADO': '<span class="badge badge-info">EGRESADO</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = alumnosData.length;
    const activos = alumnosData.filter(a => a.alu_estado === 'ACTIVO').length;
    const inactivos = alumnosData.filter(a => a.alu_estado === 'INACTIVO').length;
    const egresados = alumnosData.filter(a => a.alu_estado === 'EGRESADO').length;
    
    const stats = document.querySelectorAll('.stat-value');
    if (stats.length >= 4) {
        stats[0].textContent = total;
        stats[1].textContent = activos;
        stats[2].textContent = inactivos;
        stats[3].textContent = egresados;
    }
}

// =============================================
// CRUD DE ALUMNOS
// =============================================

// Guardar alumno (crear o actualizar)
async function guardarAlumno(formData) {
    const rut = formData.get('alumnoRut');
    
    // Validar RUT
    if (!PanolApp.validarRut(rut)) {
        PanolApp.showToast('RUT inválido', 'error');
        document.getElementById('alumnoRutError').style.display = 'block';
        return;
    }
    
    const alumno = {
        alu_rut: rut.replace(/\./g, '').replace(/-/g, ''),
        alu_nombres: formData.get('alumnoNombres'),
        alu_apellidos: formData.get('alumnoApellidos'),
        alu_email: formData.get('alumnoEmail'),
        alu_telefono: formData.get('alumnoTelefono'),
        cur_codigo: formData.get('alumnoCurso'),
        gru_id: formData.get('alumnoGrupo') || null,
        alu_anio_ingreso: formData.get('alumnoAnioIngreso'),
        alu_estado: 'ACTIVO'
    };
    
    try {
        const existe = alumnosData.some(a => a.alu_rut === alumno.alu_rut);
        const endpoint = existe ? `/alumnos/${alumno.alu_rut}` : '/alumnos';
        const method = existe ? 'PUT' : 'POST';
        
        const response = await PanolApp.fetchAPI(endpoint, method, alumno);
        
        if (response) {
            // Si se asignó a un grupo, registrar en integrantes_grupo
            if (alumno.gru_id) {
                await asignarAlumnoAGrupo(alumno.alu_rut, alumno.gru_id);
            }
            
            PanolApp.showToast(`Alumno ${existe ? 'actualizado' : 'registrado'} exitosamente`, 'success');
            PanolApp.closeModal('alumnoModal');
            cargarAlumnos();
        }
    } catch (error) {
        console.error('Error guardando alumno:', error);
        PanolApp.showToast('Error al guardar alumno', 'error');
    }
}

// Asignar alumno a grupo
async function asignarAlumnoAGrupo(aluRut, gruId, esResponsable = false) {
    try {
        const data = {
            alu_rut: aluRut,
            gru_id: gruId,
            ing_rol: esResponsable ? 'RESPONSABLE' : 'INTEGRANTE'
        };
        
        await PanolApp.fetchAPI('/grupos/integrantes', 'POST', data);
    } catch (error) {
        console.error('Error asignando alumno a grupo:', error);
    }
}

// Editar alumno
function editarAlumno(rut) {
    const alumno = alumnosData.find(a => a.alu_rut === rut);
    if (!alumno) return;
    
    document.getElementById('alumnoRut').value = PanolApp.formatearRut(alumno.alu_rut);
    document.getElementById('alumnoRut').readOnly = true;
    document.getElementById('alumnoNombres').value = alumno.alu_nombres;
    document.getElementById('alumnoApellidos').value = alumno.alu_apellidos;
    document.getElementById('alumnoEmail').value = alumno.alu_email || '';
    document.getElementById('alumnoTelefono').value = alumno.alu_telefono || '';
    document.getElementById('alumnoCurso').value = alumno.cur_codigo;
    document.getElementById('alumnoAnioIngreso').value = alumno.alu_anio_ingreso;
    
    // Cargar grupos del curso y seleccionar el actual
    if (alumno.cur_codigo) {
        cargarGruposPorCurso(alumno.cur_codigo).then(() => {
            if (alumno.gru_id) {
                document.getElementById('alumnoGrupo').value = alumno.gru_id;
            }
        });
    }
    
    document.querySelector('#alumnoModal .modal-title').textContent = 'Editar Alumno';
    PanolApp.openModal('alumnoModal');
}

// Cambiar estado del alumno
async function cambiarEstadoAlumno(rut, nuevoEstado) {
    const mensajes = {
        'ACTIVO': '¿Desea reactivar este alumno?',
        'INACTIVO': '¿Desea desactivar este alumno?',
        'EGRESADO': '¿Desea marcar este alumno como egresado?'
    };
    
    if (!confirm(mensajes[nuevoEstado])) return;
    
    try {
        const response = await PanolApp.fetchAPI(`/alumnos/${rut}/estado`, 'PUT', {
            alu_estado: nuevoEstado
        });
        
        if (response) {
            PanolApp.showToast('Estado actualizado exitosamente', 'success');
            cargarAlumnos();
        }
    } catch (error) {
        console.error('Error cambiando estado:', error);
        PanolApp.showToast('Error al cambiar estado', 'error');
    }
}

// Ver historial del alumno
async function verHistorialAlumno(rut) {
    try {
        const response = await PanolApp.fetchAPI(`/alumnos/${rut}/historial`);
        if (response && response.length > 0) {
            const historial = response.map(h => 
                `${PanolApp.formatearFecha(h.fecha)}: ${h.descripcion}`
            ).join('\n');
            
            alert(`Historial del Alumno:\n\n${historial}`);
        } else {
            alert('No hay historial registrado para este alumno');
        }
    } catch (error) {
        console.error('Error obteniendo historial:', error);
    }
}

// Cambiar grupo del alumno
function cambiarGrupoAlumno(rut) {
    const alumno = alumnosData.find(a => a.alu_rut === rut);
    if (!alumno || !alumno.cur_codigo) {
        PanolApp.showToast('El alumno debe estar asignado a un curso primero', 'warning');
        return;
    }
    
    // Abrir modal con selector de grupos
    cargarGruposPorCurso(alumno.cur_codigo);
    PanolApp.showToast('Seleccione el nuevo grupo en el modal', 'info');
    editarAlumno(rut);
}

// =============================================
// FILTROS Y BÚSQUEDA
// =============================================

// Aplicar filtros
function aplicarFiltros() {
    const taller = document.getElementById('filtroTaller').value;
    const curso = document.getElementById('filtroCurso').value;
    const estado = document.getElementById('filtroEstado').value;
    
    let alumnosFiltrados = [...alumnosData];
    
    if (taller) {
        alumnosFiltrados = alumnosFiltrados.filter(a => 
            a.taller_codigo === taller
        );
    }
    
    if (curso) {
        alumnosFiltrados = alumnosFiltrados.filter(a => 
            a.cur_codigo === curso
        );
    }
    
    if (estado) {
        alumnosFiltrados = alumnosFiltrados.filter(a => 
            a.alu_estado === estado
        );
    }
    
    renderAlumnosTable(alumnosFiltrados);
    PanolApp.showToast(`${alumnosFiltrados.length} alumnos encontrados`, 'info');
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('filtroTaller').value = '';
    document.getElementById('filtroCurso').value = '';
    document.getElementById('filtroEstado').value = '';
    renderAlumnosTable(alumnosData);
}

// =============================================
// IMPORTACIÓN MASIVA
// =============================================

// Importar alumnos desde CSV
async function importarAlumnosCSV(archivo) {
    // Implementar importación desde CSV
    PanolApp.showToast('Procesando archivo...', 'info');
    
    // Aquí iría la lógica de parseo CSV y carga masiva
    setTimeout(() => {
        PanolApp.showToast('Alumnos importados exitosamente', 'success');
        cargarAlumnos();
    }, 2000);
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarAlumnos();
    cargarCursosDisponibles();
    
    // Configurar búsqueda en tabla
    PanolApp.setupTableSearch('searchAlumnos', 'alumnosTable');
    
    // Event listener del formulario
    const alumnoForm = document.getElementById('alumnoForm');
    if (alumnoForm) {
        alumnoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            guardarAlumno(formData);
        });
    }
    
    // Formatear RUT mientras se escribe
    const rutInput = document.getElementById('alumnoRut');
    const rutError = document.getElementById('alumnoRutError');
    
    if (rutInput) {
        rutInput.addEventListener('input', function(e) {
            e.target.value = PanolApp.formatearRut(e.target.value);
            if (rutError) rutError.style.display = 'none';
        });
    }
    
    // Cargar grupos cuando cambia el curso
    const cursoSelect = document.getElementById('alumnoCurso');
    if (cursoSelect) {
        cursoSelect.addEventListener('change', function(e) {
            if (e.target.value) {
                cargarGruposPorCurso(e.target.value);
            } else {
                document.getElementById('alumnoGrupo').innerHTML = '<option value="">Sin asignar</option>';
            }
        });
    }
    
    // Limpiar formulario al abrir modal
    const alumnoModal = document.getElementById('alumnoModal');
    if (alumnoModal) {
        alumnoModal.addEventListener('click', function(e) {
            if (e.target === this) {
                const form = alumnoForm;
                if (form) {
                    form.reset();
                    rutInput.readOnly = false;
                    document.querySelector('#alumnoModal .modal-title').textContent = 'Nuevo Alumno';
                }
            }
        });
    }
    
    // Verificar si viene con parámetro de curso en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const cursoParam = urlParams.get('curso');
    if (cursoParam) {
        document.getElementById('filtroCurso').value = cursoParam;
        aplicarFiltros();
    }
});
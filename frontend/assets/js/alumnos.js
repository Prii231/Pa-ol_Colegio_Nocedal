/* =============================================
   ALUMNOS.JS - Gestión de Alumnos
   Página: alumnos.html
   ============================================= */

console.log('🎓 ALUMNOS.JS: Cargando...');

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

// Cargar cursos disponibles (CORREGIDO: Ruta /talleres/cursos)
async function cargarCursosDisponibles() {
    try {
        // CAMBIO IMPORTANTE: La ruta correcta es /talleres/cursos
        const response = await PanolApp.fetchAPI('/talleres/cursos');
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

// Cargar grupos de un curso (CORREGIDO: Filtra en el cliente)
async function cargarGruposPorCurso(curCodigo) {
    const selectGrupo = document.getElementById('alumnoGrupo');
    if (!selectGrupo) return;

    selectGrupo.innerHTML = '<option value="">Cargando...</option>';
    selectGrupo.disabled = true;

    try {
        // CAMBIO: Pedimos todos los grupos y filtramos aquí
        const response = await PanolApp.fetchAPI('/talleres/grupos');

        if (response) {
            // Filtrar solo los grupos del curso seleccionado
            gruposDisponibles = response.filter(g => g.cur_codigo === curCodigo);
            llenarSelectGrupos();
            selectGrupo.disabled = false;
        }
    } catch (error) {
        console.error('Error cargando grupos:', error);
        selectGrupo.innerHTML = '<option value="">Error al cargar</option>';
    }
}

// Llenar select de grupos
function llenarSelectGrupos() {
    const selectGrupo = document.getElementById('alumnoGrupo');
    if (selectGrupo) {
        selectGrupo.innerHTML = '<option value="">Sin asignar (Opcional)</option>' +
            gruposDisponibles.map(grupo => {
                const integrantes = grupo.cantidad_integrantes || 0;
                // Permitimos seleccionar aunque esté lleno por si se está editando un alumno ya perteneciente
                return `<option value="${grupo.gru_id}">
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

    if (alumnos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay alumnos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = alumnos.map(alumno => `
        <tr data-rut="${alumno.alu_rut}">
            <td>${PanolApp.formatearRut(alumno.alu_rut)}</td>
            <td><strong>${alumno.alu_nombres} ${alumno.alu_apellidos}</strong></td>
            <td>${alumno.alu_email || '-'}</td>
            <td>${alumno.curso_nombre || '<span class="badge badge-warning">Sin Asignar</span>'}</td>
            <td>${alumno.grupo_nombre || '<span class="badge badge-secondary">Sin grupo</span>'}</td>
            <td>${getEstadoBadge(alumno.alu_estado)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Editar" onclick="editarAlumno('${alumno.alu_rut}')">✏️</button>
                    <button class="btn-icon" title="Ver historial" onclick="verHistorialAlumno('${alumno.alu_rut}')">📄</button>
                    <button class="btn-icon" title="Cambiar grupo" onclick="cambiarGrupoAlumno('${alumno.alu_rut}')">↔️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getEstadoBadge(estado) {
    const badges = {
        'ACTIVO': '<span class="badge badge-success">ACTIVO</span>',
        'INACTIVO': '<span class="badge badge-warning">INACTIVO</span>',
        'EGRESADO': '<span class="badge badge-info">EGRESADO</span>'
    };
    return badges[estado] || '<span class="badge badge-secondary">-</span>';
}

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

// Función unificada para guardar (Crear/Editar)
async function guardarAlumnoConDatos(formData) {
    console.log('🔵 guardarAlumnoConDatos() INICIANDO', formData);

    const rut = formData.rut;

    // 1. Validar RUT
    if (!rut || !PanolApp.validarRut(rut)) {
        PanolApp.showToast('RUT inválido', 'error');
        return;
    }

    // 2. Validar Campos Obligatorios (Nombres, Apellidos, Curso)
    if (!formData.nombres || !formData.apellidos || !formData.curso) {
        PanolApp.showToast('Nombres, Apellidos y Curso son obligatorios', 'error');
        return;
    }

    // 3. Preparar Objeto Final
    const alumno = {
        alu_rut: rut.replace(/\./g, '').replace(/-/g, ''), // Limpiar formato
        alu_nombres: formData.nombres,
        alu_apellidos: formData.apellidos,
        alu_email: formData.email || null,
        alu_telefono: formData.telefono || null,
        cur_codigo: formData.curso,
        gru_id: formData.grupo || null, // Clave para la desasignación: null si está vacío
        alu_anio_ingreso: formData.anio,
        alu_estado: 'ACTIVO'
    };

    // 4. Determinar POST (Nuevo) o PUT (Editar)
    const existe = alumnosData.some(a => a.alu_rut === alumno.alu_rut);
    const endpoint = existe ? `/alumnos/${alumno.alu_rut}` : '/alumnos';
    const method = existe ? 'PUT' : 'POST';

    try {
        // 5. Enviar petición principal (Alumno)
        const response = await PanolApp.fetchAPI(endpoint, method, alumno);

        if (response) {
            // 6. LÓGICA DE ASIGNACIÓN/REMOCIÓN DE GRUPO
            if (existe) { // Estamos EDITANDO un alumno existente
                if (alumno.gru_id) {
                    // Caso A: Tiene grupo, asignamos/actualizamos (UPSERT)
                    await asignarAlumnoAGrupo(alumno.alu_rut, alumno.gru_id);
                } else {
                    // Caso B: El grupo es null ('Sin asignar'), removemos la asignación
                    await removerAlumnoDeGrupo(alumno.alu_rut);
                }
            } else if (alumno.gru_id) { // Si es NUEVO alumno y tiene un grupo
                // Caso C: Nuevo alumno con grupo
                await asignarAlumnoAGrupo(alumno.alu_rut, alumno.gru_id);
            }

            // 7. Feedback y recarga
            PanolApp.showToast(`Alumno ${existe ? 'actualizado' : 'registrado'} exitosamente`, 'success');
            PanolApp.closeModal('alumnoModal');
            cargarAlumnos();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        PanolApp.showToast('Error al guardar alumno: ' + error.message, 'error');
    }
}

async function asignarAlumnoAGrupo(aluRut, gruId) {
    try {
        const data = {
            alu_rut: aluRut,
            gru_id: gruId,
            ing_rol: 'INTEGRANTE'
        };
        await PanolApp.fetchAPI('/alumnos/grupos/integrantes', 'POST', data);
    } catch (error) {
        console.error('Error asignando grupo:', error);
        // No mostramos error al usuario para no interrumpir el flujo principal
    }
}

// Editar alumno
function editarAlumno(rut) {
    const alumno = alumnosData.find(a => a.alu_rut === rut);
    if (!alumno) return;

    // Rellenar formulario
    document.getElementById('alumnoRut').value = PanolApp.formatearRut(alumno.alu_rut);
    document.getElementById('alumnoRut').readOnly = true; // No se puede cambiar el RUT al editar
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

// Ver historial
async function verHistorialAlumno(rut) {
    try {
        const response = await PanolApp.fetchAPI(`/alumnos/${rut}/historial`);
        if (response && response.length > 0) {
            const historial = response.map(h =>
                `${PanolApp.formatearFecha(h.fecha)}: ${h.descripcion}`
            ).join('\n');
            alert(`Historial:\n\n${historial}`);
        } else {
            alert('No hay historial registrado.');
        }
    } catch (error) {
        console.error(error);
    }
}

// Cambiar solo el grupo (acceso rápido)
function cambiarGrupoAlumno(rut) {
    editarAlumno(rut);
    PanolApp.showToast('Cambie el grupo en el formulario y guarde', 'info');
}

// 1. FUNCIÓN QUE REMUEVE EL GRUPO (La que estaba dando el error ReferenceError)
async function removerAlumnoDeGrupo(aluRut) {
    try {
        console.log('📡 Llamando a DELETE para remover grupo:', aluRut);
        // Usa la ruta DELETE que implementamos en el backend
        await PanolApp.fetchAPI(`/alumnos/grupos/integrantes/${aluRut}`, 'DELETE');
    } catch (error) {
        console.error('Error removiendo alumno del grupo:', error);
        // Puedes añadir un PanolApp.showToast si la remoción es crítica
    }
}
// 2. FUNCIÓN QUE ASIGNA/ACTUALIZA EL GRUPO (También es necesaria, ya que se llama en el bloque)
async function asignarAlumnoAGrupo(aluRut, gruId) {
    try {
        const data = {
            alu_rut: aluRut,
            gru_id: gruId,
            ing_rol: 'INTEGRANTE'
        };
        // Llama a la ruta POST/UPSERT del backend
        await PanolApp.fetchAPI('/alumnos/grupos/integrantes', 'POST', data);
    } catch (error) {
        console.error('Error asignando grupo:', error);
    }
}



// =============================================
// FILTROS
// =============================================

function aplicarFiltros() {
    const taller = document.getElementById('filtroTaller').value;
    const curso = document.getElementById('filtroCurso').value;
    const estado = document.getElementById('filtroEstado').value;

    let filtrados = alumnosData;

    if (taller) filtrados = filtrados.filter(a => a.taller_codigo === taller);
    if (curso) filtrados = filtrados.filter(a => a.cur_codigo === curso);
    if (estado) filtrados = filtrados.filter(a => a.alu_estado === estado);

    renderAlumnosTable(filtrados);
}

// =============================================
// UTILIDADES Y EVENTOS
// =============================================

function abrirModalNuevoAlumno() {
    const form = document.getElementById('alumnoForm');
    if (form) form.reset();

    // Resetear RUT a editable
    const rutInput = document.getElementById('alumnoRut');
    if (rutInput) rutInput.readOnly = false;

    // Resetear select de grupo
    const grupoSelect = document.getElementById('alumnoGrupo');
    if (grupoSelect) {
        grupoSelect.innerHTML = '<option value="">Seleccione un curso primero...</option>';
        grupoSelect.disabled = true;
    }

    document.querySelector('#alumnoModal .modal-title').textContent = 'Nuevo Alumno';
    PanolApp.openModal('alumnoModal');
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('🎓 Inicializando módulo Alumnos...');

    cargarAlumnos();
    cargarCursosDisponibles(); // Llenar select de cursos al inicio

    // Configurar formulario
    const alumnoForm = document.getElementById('alumnoForm');
    if (alumnoForm) {
        alumnoForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                rut: document.getElementById('alumnoRut').value,
                nombres: document.getElementById('alumnoNombres').value,
                apellidos: document.getElementById('alumnoApellidos').value,
                email: document.getElementById('alumnoEmail').value,
                telefono: document.getElementById('alumnoTelefono').value,
                curso: document.getElementById('alumnoCurso').value,
                grupo: document.getElementById('alumnoGrupo').value,
                anio: document.getElementById('alumnoAnioIngreso').value
            };

            await guardarAlumnoConDatos(formData);
        });
    }

    // Formato RUT
    const rutInput = document.getElementById('alumnoRut');
    if (rutInput) {
        rutInput.addEventListener('input', function (e) {
            e.target.value = PanolApp.formatearRut(e.target.value);
        });
    }

    // Cambio de Curso -> Cargar Grupos
    const cursoSelect = document.getElementById('alumnoCurso');
    if (cursoSelect) {
        cursoSelect.addEventListener('change', function (e) {
            const cursoCodigo = e.target.value;
            if (cursoCodigo) {
                cargarGruposPorCurso(cursoCodigo);
            } else {
                const grupoSelect = document.getElementById('alumnoGrupo');
                grupoSelect.innerHTML = '<option value="">Seleccione un curso primero...</option>';
                grupoSelect.disabled = true;
            }
        });
    }

    // Función para remover la asignación de grupo
    async function removerAlumnoDeGrupo(aluRut) {
        try {
            console.log('📡 Llamando a DELETE para remover grupo:', aluRut);
            // Llama al nuevo endpoint DELETE
            await PanolApp.fetchAPI(`/alumnos/grupos/integrantes/${aluRut}`, 'DELETE');
        } catch (error) {
            console.error('Error removiendo alumno del grupo:', error);
        }
    }


});
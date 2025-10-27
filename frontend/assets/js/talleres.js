/* =============================================
   TALLERES.JS - Gestión de Talleres, Cursos y Grupos
   Página: talleres.html
   ============================================= */

// =============================================
// GESTIÓN DE TALLERES
// =============================================

let talleresData = [];
let cursosData = [];
let gruposData = [];

// Cargar todos los talleres
async function cargarTalleres() {
    try {
        const response = await PanolApp.fetchAPI('/talleres');
        if (response) {
            talleresData = response;
            renderTalleresTable();
        }
    } catch (error) {
        console.error('Error cargando talleres:', error);
        PanolApp.showToast('Error al cargar talleres', 'error');
    }
}

// Renderizar tabla de talleres
function renderTalleresTable() {
    const tbody = document.getElementById('talleresTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = talleresData.map(taller => `
        <tr>
            <td><strong>${taller.tal_codigo}</strong></td>
            <td>${taller.tal_nombre}</td>
            <td>${taller.tal_descripcion || '-'}</td>
            <td>${taller.tal_ubicacion || '-'}</td>
            <td>
                ${taller.docente_nombre ? 
                    `<span class="badge badge-success">${taller.docente_nombre}</span>` : 
                    `<span class="badge badge-secondary">Por asignar</span>`
                }
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Editar" onclick="editarTaller('${taller.tal_codigo}')">✏️</button>
                    <button class="btn-icon" title="Ver detalles" onclick="verTaller('${taller.tal_codigo}')">👁️</button>
                    <button class="btn-icon" title="Asignar docente" onclick="asignarDocente('${taller.tal_codigo}')">👤</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Crear/Actualizar taller - CORREGIDO: Lee valores directamente del DOM
async function guardarTaller(formData) {
    // Leer valores directamente del DOM por ID
    const taller = {
        tal_codigo: document.getElementById('tallerCodigo').value.trim(),
        tal_nombre: document.getElementById('tallerNombre').value.trim(),
        tal_descripcion: document.getElementById('tallerDescripcion').value.trim(),
        tal_ubicacion: document.getElementById('tallerUbicacion').value.trim()
    };
    
    // Validar campos requeridos
    if (!taller.tal_codigo || !taller.tal_nombre) {
        PanolApp.showToast('Código y Nombre son obligatorios', 'error');
        return;
    }
    
    try {
        const isEdit = talleresData.some(t => t.tal_codigo === taller.tal_codigo);
        const endpoint = isEdit ? `/talleres/${taller.tal_codigo}` : '/talleres';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await PanolApp.fetchAPI(endpoint, method, taller);
        
        if (response) {
            PanolApp.showToast(`Taller ${isEdit ? 'actualizado' : 'creado'} exitosamente`, 'success');
            PanolApp.closeModal('tallerModal');
            cargarTalleres();
        }
    } catch (error) {
        console.error('Error guardando taller:', error);
        PanolApp.showToast('Error al guardar taller', 'error');
    }
}

// Editar taller
function editarTaller(codigo) {
    const taller = talleresData.find(t => t.tal_codigo === codigo);
    if (!taller) return;
    
    document.getElementById('tallerCodigo').value = taller.tal_codigo;
    document.getElementById('tallerCodigo').readOnly = true;
    document.getElementById('tallerNombre').value = taller.tal_nombre;
    document.getElementById('tallerDescripcion').value = taller.tal_descripcion || '';
    document.getElementById('tallerUbicacion').value = taller.tal_ubicacion || '';
    
    document.querySelector('#tallerModal .modal-title').textContent = 'Editar Taller';
    PanolApp.openModal('tallerModal');
}

// Ver detalles del taller
async function verTaller(codigo) {
    try {
        const response = await PanolApp.fetchAPI(`/talleres/${codigo}/estadisticas`);
        if (response) {
            // Mostrar estadísticas del taller
            alert(`Estadísticas de ${codigo}:\n` +
                  `Total Cajas: ${response.total_cajas}\n` +
                  `Cajas Prestadas: ${response.cajas_prestadas}\n` +
                  `Items Extraviados: ${response.items_extraviados}`);
        }
    } catch (error) {
        console.error('Error obteniendo detalles:', error);
    }
}

// Asignar docente a taller
function asignarDocente(codigoTaller) {
    // Implementar modal de asignación de docente
    PanolApp.showToast('Funcionalidad en desarrollo', 'info');
}

// =============================================
// GESTIÓN DE CURSOS
// =============================================

// Cargar todos los cursos
async function cargarCursos() {
    try {
        const response = await PanolApp.fetchAPI('/cursos');
        if (response) {
            cursosData = response;
            renderCursosTable();
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
        PanolApp.showToast('Error al cargar cursos', 'error');
    }
}

// Renderizar tabla de cursos
function renderCursosTable() {
    const tbody = document.getElementById('cursosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = cursosData.map(curso => `
        <tr>
            <td><strong>${curso.cur_codigo}</strong></td>
            <td>${curso.cur_nivel}</td>
            <td>${curso.cur_letra}</td>
            <td><span class="badge badge-info">${curso.taller_nombre}</span></td>
            <td>${curso.cur_cantidad_alumnos || 30}</td>
            <td>${curso.cantidad_grupos || 10}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Editar" onclick="editarCurso('${curso.cur_codigo}')">✏️</button>
                    <button class="btn-icon" title="Ver grupos" onclick="verGruposCurso('${curso.cur_codigo}')">👥</button>
                    <button class="btn-icon" title="Ver alumnos" onclick="verAlumnosCurso('${curso.cur_codigo}')">📋</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Guardar curso - CORREGIDO: Lee valores directamente del DOM
async function guardarCurso(formData) {
    // Leer valores directamente del DOM por ID
    const nivel = document.getElementById('cursoNivel').value;
    const letra = document.getElementById('cursoLetra').value.trim();
    const tallerCodigo = document.getElementById('cursoTaller').value;
    const cantidadAlumnos = document.getElementById('cursoCantidadAlumnos').value || 30;
    const anio = new Date().getFullYear();
    
    // Validar campos requeridos
    if (!nivel || !letra || !tallerCodigo) {
        PanolApp.showToast('Nivel, Letra y Taller son obligatorios', 'error');
        return;
    }
    
    const curso = {
        cur_codigo: `${nivel === 'Tercero Medio' ? '3M' : '4M'}${letra}-${tallerCodigo}`,
        cur_nivel: nivel,
        cur_letra: letra,
        cur_anio: anio,
        tal_codigo: tallerCodigo,
        cur_cantidad_alumnos: cantidadAlumnos
    };
    
    try {
        const response = await PanolApp.fetchAPI('/cursos', 'POST', curso);
        
        if (response) {
            PanolApp.showToast('Curso creado exitosamente', 'success');
            PanolApp.closeModal('cursoModal');
            cargarCursos();
            
            // Crear grupos automáticamente
            await crearGruposAutomaticos(curso.cur_codigo);
        }
    } catch (error) {
        console.error('Error guardando curso:', error);
        PanolApp.showToast('Error al guardar curso', 'error');
    }
}

// Crear grupos automáticos para un curso
async function crearGruposAutomaticos(curCodigo) {
    const cantidadGrupos = 10; // Según configuración del sistema
    
    for (let i = 1; i <= cantidadGrupos; i++) {
        const grupo = {
            gru_numero: i,
            gru_nombre: `Grupo ${i} - ${curCodigo}`,
            cur_codigo: curCodigo,
            gru_anio: new Date().getFullYear(),
            gru_estado: 'ACTIVO'
        };
        
        await PanolApp.fetchAPI('/grupos', 'POST', grupo);
    }
    
    PanolApp.showToast(`${cantidadGrupos} grupos creados automáticamente`, 'success');
}

// Editar curso
function editarCurso(codigo) {
    const curso = cursosData.find(c => c.cur_codigo === codigo);
    if (!curso) return;
    
    document.getElementById('cursoNivel').value = curso.cur_nivel;
    document.getElementById('cursoLetra').value = curso.cur_letra;
    document.getElementById('cursoTaller').value = curso.tal_codigo;
    document.getElementById('cursoCantidadAlumnos').value = curso.cur_cantidad_alumnos;
    
    document.querySelector('#cursoModal .modal-title').textContent = 'Editar Curso';
    PanolApp.openModal('cursoModal');
}

// Ver grupos del curso
function verGruposCurso(curCodigo) {
    // Cambiar a la pestaña de grupos y filtrar
    PanolApp.switchTab('talleresTabsContainer', 2);
    filtrarGruposPorCurso(curCodigo);
}

// Ver alumnos del curso
function verAlumnosCurso(curCodigo) {
    window.location.href = `alumnos.html?curso=${curCodigo}`;
}

// =============================================
// GESTIÓN DE GRUPOS
// =============================================

// Cargar todos los grupos
async function cargarGrupos() {
    try {
        const response = await PanolApp.fetchAPI('/grupos');
        if (response) {
            gruposData = response;
            renderGruposTable();
        }
    } catch (error) {
        console.error('Error cargando grupos:', error);
        PanolApp.showToast('Error al cargar grupos', 'error');
    }
}

// Renderizar tabla de grupos
function renderGruposTable() {
    const tbody = document.getElementById('gruposTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = gruposData.map(grupo => `
        <tr>
            <td>${grupo.gru_numero}</td>
            <td><strong>${grupo.gru_nombre}</strong></td>
            <td>${grupo.curso_nombre}</td>
            <td>${grupo.taller_nombre}</td>
            <td>${grupo.cantidad_integrantes || 0}/3</td>
            <td>
                ${grupo.tiene_prestamo ? 
                    '<span class="badge badge-success">Con Préstamo</span>' : 
                    '<span class="badge badge-warning">Sin Préstamo</span>'
                }
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Ver integrantes" onclick="verIntegrantesGrupo(${grupo.gru_id})">👥</button>
                    <button class="btn-icon" title="Editar" onclick="editarGrupo(${grupo.gru_id})">✏️</button>
                    ${!grupo.tiene_prestamo ? 
                        `<button class="btn-icon" title="Asignar préstamo" onclick="asignarPrestamoGrupo(${grupo.gru_id})">📋</button>` : 
                        `<button class="btn-icon" title="Ver préstamo" onclick="verPrestamoGrupo(${grupo.gru_id})">📄</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Guardar grupo - CORREGIDO: Lee valores directamente del DOM
async function guardarGrupo(formData) {
    // Leer valores directamente del DOM por ID
    const grupoNumero = document.getElementById('grupoNumero').value;
    const grupoNombre = document.getElementById('grupoNombre').value.trim();
    const grupoCurso = document.getElementById('grupoCurso').value;
    
    // Validar campos requeridos
    if (!grupoNumero || !grupoNombre || !grupoCurso) {
        PanolApp.showToast('Todos los campos son obligatorios', 'error');
        return;
    }
    
    const grupo = {
        gru_numero: grupoNumero,
        gru_nombre: grupoNombre,
        cur_codigo: grupoCurso,
        gru_anio: new Date().getFullYear(),
        gru_estado: 'ACTIVO'
    };
    
    try {
        const response = await PanolApp.fetchAPI('/grupos', 'POST', grupo);
        
        if (response) {
            PanolApp.showToast('Grupo creado exitosamente', 'success');
            PanolApp.closeModal('grupoModal');
            cargarGrupos();
        }
    } catch (error) {
        console.error('Error guardando grupo:', error);
        PanolApp.showToast('Error al guardar grupo', 'error');
    }
}

// Ver integrantes del grupo
async function verIntegrantesGrupo(grupoId) {
    try {
        const response = await PanolApp.fetchAPI(`/grupos/${grupoId}/integrantes`);
        if (response && response.length > 0) {
            const integrantes = response.map(i => 
                `${i.alu_nombres} ${i.alu_apellidos} ${i.ing_rol === 'RESPONSABLE' ? '(Responsable)' : ''}`
            ).join('\n');
            
            alert(`Integrantes del Grupo:\n\n${integrantes}`);
        } else {
            alert('Este grupo aún no tiene integrantes asignados');
        }
    } catch (error) {
        console.error('Error obteniendo integrantes:', error);
    }
}

// Editar grupo
function editarGrupo(grupoId) {
    const grupo = gruposData.find(g => g.gru_id === grupoId);
    if (!grupo) return;
    
    document.getElementById('grupoCurso').value = grupo.cur_codigo;
    document.getElementById('grupoNumero').value = grupo.gru_numero;
    document.getElementById('grupoNombre').value = grupo.gru_nombre;
    
    document.querySelector('#grupoModal .modal-title').textContent = 'Editar Grupo';
    PanolApp.openModal('grupoModal');
}

// Asignar préstamo a grupo
function asignarPrestamoGrupo(grupoId) {
    window.location.href = `prestamos.html?grupo=${grupoId}`;
}

// Ver préstamo del grupo
function verPrestamoGrupo(grupoId) {
    window.location.href = `prestamos.html?grupo=${grupoId}`;
}

// Filtrar grupos por curso
function filtrarGruposPorCurso(curCodigo) {
    const tbody = document.getElementById('gruposTableBody');
    if (!tbody) return;
    
    const gruposFiltrados = gruposData.filter(g => g.cur_codigo === curCodigo);
    
    tbody.innerHTML = gruposFiltrados.map(grupo => `
        <tr>
            <td>${grupo.gru_numero}</td>
            <td><strong>${grupo.gru_nombre}</strong></td>
            <td>${grupo.curso_nombre}</td>
            <td>${grupo.taller_nombre}</td>
            <td>${grupo.cantidad_integrantes || 0}/3</td>
            <td>
                ${grupo.tiene_prestamo ? 
                    '<span class="badge badge-success">Con Préstamo</span>' : 
                    '<span class="badge badge-warning">Sin Préstamo</span>'
                }
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Ver integrantes" onclick="verIntegrantesGrupo(${grupo.gru_id})">👥</button>
                    <button class="btn-icon" title="Editar" onclick="editarGrupo(${grupo.gru_id})">✏️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarTalleres();
    cargarCursos();
    cargarGrupos();
    
    // Event listeners de formularios - CORREGIDO
    const tallerForm = document.getElementById('tallerForm');
    if (tallerForm) {
        tallerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarTaller(); // Ya no necesita formData como parámetro
        });
    }
    
    const cursoForm = document.getElementById('cursoForm');
    if (cursoForm) {
        cursoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarCurso(); // Ya no necesita formData como parámetro
        });
    }
    
    const grupoForm = document.getElementById('grupoForm');
    if (grupoForm) {
        grupoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarGrupo(); // Ya no necesita formData como parámetro
        });
    }
    
    // Limpiar formularios al abrir modales
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                const form = this.querySelector('form');
                if (form) form.reset();
            }
        });
    });
});
/* =============================================
   TALLERES.JS - VERSIÓN ULTRA-DEBUG
   ============================================= */

console.log('🔥 TALLERES.JS: Archivo cargándose...');

let talleresData = [];
let cursosData = [];
let gruposData = [];

// Cargar todos los talleres
async function cargarTalleres() {
    console.log('📥 cargarTalleres() iniciando...');
    try {
        const response = await PanolApp.fetchAPI('/talleres');
        if (response) {
            talleresData = response;
            console.log('✅ Talleres cargados:', talleresData.length);
            renderTalleresTable();
            cargarTalleresEnSelect(); // Llenar select de talleres
        }
    } catch (error) {
        console.error('❌ Error cargando talleres:', error);
        PanolApp.showToast('Error al cargar talleres', 'error');
    }
}

function renderTalleresTable() {
    console.log('🎨 renderTalleresTable() iniciando...');
    const tbody = document.getElementById('talleresTableBody');
    if (!tbody) {
        console.error('❌ tbody #talleresTableBody NO encontrado');
        return;
    }

    tbody.innerHTML = talleresData.map(taller => `
        <tr>
            <td><strong>${taller.tal_codigo}</strong></td>
            <td>${taller.tal_nombre}</td>
            <td>${taller.tal_descripcion || '-'}</td>
            <td>${taller.tal_ubicacion || '-'}</td>
            <td>
                ${taller.tal_docente_encargado ?
            `<span class="badge badge-success">${taller.tal_docente_encargado}</span>` :
            `<span class="badge badge-secondary">Por asignar</span>`
        }
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Eliminar" onclick="eliminarTaller('${taller.tal_codigo}')">🗑️</button>
                    <button class="btn-icon" title="Editar" onclick="editarTaller('${taller.tal_codigo}')">✏️</button>
                    <button class="btn-icon" title="Ver detalles" onclick="abrirModalVer('${taller.tal_codigo}')">👁️</button>
                </div>
            </td>
        </tr>
    `).join('');
    console.log('✅ Tabla de talleres renderizada');
}

// Llenar select de talleres en el modal de curso
function cargarTalleresEnSelect() {
    const selectTaller = document.getElementById('cursoTaller');
    if (!selectTaller) {
        console.warn('⚠️ Select #cursoTaller no encontrado');
        return;
    }

    // Limpiar opciones existentes excepto la primera
    selectTaller.innerHTML = '<option value="">Seleccione...</option>';

    // Agregar cada taller como opción
    talleresData.forEach(taller => {
        const option = document.createElement('option');
        option.value = taller.tal_codigo;
        option.textContent = `${taller.tal_codigo} - ${taller.tal_nombre}`;
        selectTaller.appendChild(option);
    });

    console.log('✅ Select de talleres llenado con', talleresData.length, 'opciones');
}

// Llenar select de cursos en el modal de grupo
function cargarCursosEnSelect() {
    const selectCurso = document.getElementById('grupoCurso');
    if (!selectCurso) {
        console.warn('⚠️ Select #grupoCurso no encontrado');
        return;
    }

    // Limpiar opciones existentes excepto la primera
    selectCurso.innerHTML = '<option value="">Seleccione...</option>';

    // Agregar cada curso como opción
    cursosData.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.cur_codigo;
        option.textContent = `${curso.cur_nivel} ${curso.cur_letra} - ${curso.taller_nombre}`;
        selectCurso.appendChild(option);
    });

    console.log('✅ Select de cursos llenado con', cursosData.length, 'opciones');
}

// FUNCIÓN PRINCIPAL - GUARDAR TALLER
async function guardarTaller() {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🚀 guardarTaller() INICIANDO');
    console.log('═══════════════════════════════════════');

    // PASO 1: Buscar elementos
    console.log('📍 PASO 1: Buscando elementos del formulario...');
    const codigoInput = document.getElementById('tallerCodigo');
    const nombreInput = document.getElementById('tallerNombre');
    const descripcionInput = document.getElementById('tallerDescripcion');
    const ubicacionInput = document.getElementById('tallerUbicacion');
    const docenteInput = document.getElementById('tallerDocente');

    console.log('🔍 Resultado búsqueda de elementos:');
    console.log('  - tallerCodigo:', codigoInput ? '✅ ENCONTRADO' : '❌ NULL');
    console.log('  - tallerNombre:', nombreInput ? '✅ ENCONTRADO' : '❌ NULL');
    console.log('  - tallerDescripcion:', descripcionInput ? '✅ ENCONTRADO' : '❌ NULL');
    console.log('  - tallerUbicacion:', ubicacionInput ? '✅ ENCONTRADO' : '❌ NULL');
    console.log('  - tallerDocente:', docenteInput ? '✅ ENCONTRADO' : '❌ NULL');

    if (!codigoInput || !nombreInput) {
        console.error('❌ ERROR FATAL: Elementos del formulario no encontrados');
        alert('ERROR: Los campos del formulario no se encontraron en el DOM.\n\nVerifica que los IDs sean correctos.');
        return;
    }

    // PASO 2: Leer valores RAW
    console.log('');
    console.log('📍 PASO 2: Leyendo valores RAW de los inputs...');
    const valorCodigo = codigoInput.value;
    const valorNombre = nombreInput.value;
    const valorDescripcion = descripcionInput ? descripcionInput.value : '';
    const valorUbicacion = ubicacionInput ? ubicacionInput.value : '';
    const valorDocente = docenteInput ? docenteInput.value : '';

    console.log('📦 Valores RAW leídos:');
    console.log('  - Código:', JSON.stringify(valorCodigo), '(tipo:', typeof valorCodigo, ')');
    console.log('  - Nombre:', JSON.stringify(valorNombre), '(tipo:', typeof valorNombre, ')');
    console.log('  - Descripción:', JSON.stringify(valorDescripcion), '(tipo:', typeof valorDescripcion, ')');
    console.log('  - Ubicación:', JSON.stringify(valorUbicacion), '(tipo:', typeof valorUbicacion, ')');
    console.log('  - Docente:', JSON.stringify(valorDocente), '(tipo:', typeof valorDocente, ')');

    // PASO 3: Procesar valores
    console.log('');
    console.log('📍 PASO 3: Procesando valores (trim)...');
    const taller = {
        tal_codigo: valorCodigo.trim(),
        tal_nombre: valorNombre.trim(),
        tal_descripcion: valorDescripcion.trim(),
        tal_ubicacion: valorUbicacion.trim(),
        tal_docente_encargado: valorDocente.trim()
    };

    console.log('📦 Objeto taller procesado:');
    console.log(JSON.stringify(taller, null, 2));

    // PASO 4: Validar
    console.log('');
    console.log('📍 PASO 4: Validando campos obligatorios...');
    console.log('  - Código válido?', taller.tal_codigo ? '✅ SÍ' : '❌ NO (vacío)');
    console.log('  - Nombre válido?', taller.tal_nombre ? '✅ SÍ' : '❌ NO (vacío)');

    if (!taller.tal_codigo || !taller.tal_nombre) {
        console.warn('⚠️ Validación FALLÓ: Campos vacíos');
        PanolApp.showToast('Código y Nombre son obligatorios', 'error');
        return;
    }

    // PASO 5: Enviar al backend
    console.log('');
    console.log('📍 PASO 5: Preparando envío al backend...');
    try {
        const isEdit = talleresData.some(t => t.tal_codigo === taller.tal_codigo);
        const endpoint = isEdit ? `/talleres/${taller.tal_codigo}` : '/talleres';
        const method = isEdit ? 'PUT' : 'POST';

        console.log('📡 Configuración de request:');
        console.log('  - Endpoint:', endpoint);
        console.log('  - Method:', method);
        console.log('  - Datos a enviar:', JSON.stringify(taller, null, 2));

        console.log('');
        console.log('🔄 Ejecutando PanolApp.fetchAPI()...');
        const response = await PanolApp.fetchAPI(endpoint, method, taller);

        console.log('');
        console.log('✅ RESPUESTA DEL SERVIDOR:');
        console.log(JSON.stringify(response, null, 2));

        if (response) {
            PanolApp.showToast(`Taller ${isEdit ? 'actualizado' : 'creado'} exitosamente`, 'success');
            PanolApp.closeModal('tallerModal');
            cargarTalleres();
        }
    } catch (error) {
        console.error('');
        console.error('❌ ERROR AL GUARDAR:');
        console.error(error);
        PanolApp.showToast('Error al guardar taller', 'error');
    }

    console.log('═══════════════════════════════════════');
    console.log('🏁 guardarTaller() FINALIZADO');
    console.log('═══════════════════════════════════════');
}


function editarTaller(codigo) {
    console.log('✏️ editarTaller() (MODO EDICIÓN):', codigo);
    const taller = talleresData.find(t => t.tal_codigo === codigo);
    if (!taller) return;

    // --- LÍNEAS NUEVAS ---
    const modal = document.getElementById('tallerModal');
    if (!modal) return;
    // 1. Asegurarse de que NO esté en modo "ver"
    modal.classList.remove('modo-ver'); 

    // --- TU CÓDIGO ORIGINAL (Está perfecto) ---
    document.getElementById('tallerCodigo').value = taller.tal_codigo;
    document.getElementById('tallerCodigo').readOnly = true;
    document.getElementById('tallerNombre').value = taller.tal_nombre;
    document.getElementById('tallerDescripcion').value = taller.tal_descripcion || '';
    document.getElementById('tallerUbicacion').value = taller.tal_ubicacion || '';
    document.getElementById('tallerDocente').value = taller.tal_docente_encargado || '';

    document.querySelector('#tallerModal .modal-title').textContent = 'Editar Taller';
    
    // --- LÍNEA NUEVA (Usando la variable del modal) ---
    PanolApp.openModal(modal.id); // 3. Abrir modal
}


// --- FUNCIÓN NUEVA ---
function abrirModalVer(codigo) {
    console.log('👁️ abrirModalVer() (MODO SOLO LECTURA):', codigo);
    const taller = talleresData.find(t => t.tal_codigo === codigo);
    if (!taller) return;

    const modal = document.getElementById('tallerModal');
    if (!modal) return;
    
    // 1. AÑADIR LA CLASE "modo-ver"
    modal.classList.add('modo-ver');

    // 2. Rellenar el formulario
    document.getElementById('tallerCodigo').value = taller.tal_codigo;
    document.getElementById('tallerCodigo').readOnly = true;
    document.getElementById('tallerNombre').value = taller.tal_nombre;
    document.getElementById('tallerDescripcion').value = taller.tal_descripcion || '';
    document.getElementById('tallerUbicacion').value = taller.tal_ubicacion || '';
    document.getElementById('tallerDocente').value = taller.tal_docente_encargado || '';

    document.querySelector('#tallerModal .modal-title').textContent = 'Ver Detalles del Taller';
    
    // 3. Abrir modal
    PanolApp.openModal(modal.id);
}


async function verTaller(codigo) {
    console.log('👁️ verTaller():', codigo);
    try {
        const response = await PanolApp.fetchAPI(`/talleres/${codigo}/estadisticas`);
        if (response) {
            alert(`Estadísticas de ${codigo}:\n` +
                `Total Cajas: ${response.total_cajas}\n` +
                `Cajas Prestadas: ${response.cajas_prestadas}\n` +
                `Items Extraviados: ${response.items_extraviados}`);
        }
    } catch (error) {
        console.error('Error obteniendo detalles:', error);
    }
}

// =============================================
// GESTIÓN DE CURSOS
// =============================================

async function cargarCursos() {
    console.log('📥 cargarCursos() iniciando...');
    try {
        const response = await PanolApp.fetchAPI('/talleres/cursos');
        if (response) {
            cursosData = response;
            console.log('✅ Cursos cargados:', cursosData.length);
            renderCursosTable();
            cargarCursosEnSelect(); // Llenar select de cursos
        }
    } catch (error) {
        console.error('❌ Error cargando cursos:', error);
        PanolApp.showToast('Error al cargar cursos', 'error');
    }
}

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
                    <button class="btn-icon" title="Ver alumnos" onclick="verAlumnosCurso('${curso.cur_codigo}')">🎓</button>
                    <button class="btn-icon" title="Eliminar" onclick="eliminarCurso('${curso.cur_codigo}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function guardarCurso() {
    console.log('📚 guardarCurso() iniciando...');

    // 1. Obtener todos los inputs, INCLUYENDO EL OCULTO
    const nivelInput = document.getElementById('cursoNivel');
    const letraInput = document.getElementById('cursoLetra');
    const tallerInput = document.getElementById('cursoTaller');
    const cantidadInput = document.getElementById('cursoCantidadAlumnos');
    const editCodigoInput = document.getElementById('cursoEditCodigo'); // <-- Input oculto clave

    // 2. Determinar el modo (Crear vs. Editar)
    const editCodigo = editCodigoInput ? editCodigoInput.value : '';
    const esEdicion = (editCodigo !== ""); // true si estamos editando
    
    console.log(`Modo de guardado: ${esEdicion ? 'EDICIÓN' : 'CREACIÓN'}`);
    if(esEdicion) console.log(`Editando código: ${editCodigo}`);

    // 3. Obtener valores del formulario (Tu código original)
    const nivel = nivelInput.value;
    const letra = letraInput.value.trim();
    const tallerCodigo = tallerInput.value;
    const cantidadAlumnos = cantidadInput?.value || 30;
    const anio = new Date().getFullYear();

    // 4. Validar (Tu código original)
    if (!nivel || !letra || !tallerCodigo) {
        console.warn('⚠️ Validación falló: campos vacíos');
        PanolApp.showToast('Nivel, Letra y Taller son obligatorios', 'error');
        return;
    }

    // 5. Construir el objeto
    // ¡Importante! El código se genera SÓLO si es nuevo.
    const curso = {
        cur_codigo: esEdicion ? editCodigo : `${nivel === 'Tercero Medio' ? '3M' : '4M'}${letra}-${tallerCodigo}`,
        cur_nivel: nivel,
        cur_letra: letra,
        cur_anio: anio,
        tal_codigo: tallerCodigo,
        cur_cantidad_alumnos: cantidadAlumnos
    };

    // 6. Determinar endpoint y método correctos
    // ¡ESTA ES LA CORRECCIÓN PRINCIPAL!
    // Usamos las rutas que creamos en 'backend/routes/talleres.js'
    const endpoint = esEdicion ? `/talleres/cursos/${editCodigo}` : '/talleres/cursos';
    const method = esEdicion ? 'PUT' : 'POST';

    console.log(`📡 Enviando curso a: ${method} ${endpoint}`);
    console.log('📦 Datos:', curso);

    try {
        // 7. Llamar a la API
        const response = await PanolApp.fetchAPI(endpoint, method, curso);

        if (response) {
            console.log(`✅ Curso ${esEdicion ? 'actualizado' : 'creado'}`);
            PanolApp.showToast(`Curso ${esEdicion ? 'actualizado' : 'creado'} exitosamente`, 'success');
            
            PanolApp.closeModal('cursoModal');
            
            // Limpiar el input oculto
            if(editCodigoInput) editCodigoInput.value = ""; 

            cargarCursos(); // Recargar la tabla
            
            // Solo crear grupos si NO es edición
            if (!esEdicion) { 
                await crearGruposAutomaticos(curso.cur_codigo);
            }
        }
    } catch (error) {
        console.error('❌ Error guardando curso:', error);
        // El error 404 ya no debería ocurrir, pero otros sí (ej. ORA-00001 si el código ya existe)
        PanolApp.showToast(`Error al guardar curso: ${error.message}`, 'error');
    }
}

function abrirModalNuevoCurso() {
    console.log('🔄 Preparando modal para "Nuevo Curso"...');
    
    // 1. Limpiar el formulario completo
    const form = document.getElementById('cursoForm');
    if (form) {
        form.reset();
    }
    
    // 2. Limpiar el campo oculto (¡El paso clave!)
    const editCodigoInput = document.getElementById('cursoEditCodigo');
    if (editCodigoInput) {
        editCodigoInput.value = ""; 
    }
    
    // 3. Poner el título correcto
    const modalTitle = document.querySelector('#cursoModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Nuevo Curso';
    }
    
    // 4. Abrir el modal
    PanolApp.openModal('cursoModal');
}

async function crearGruposAutomaticos(curCodigo) {
    console.log('👥 Creando grupos automáticos para:', curCodigo);
    const cantidadGrupos = 10;

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

function editarCurso(codigo) {
    console.log('✏️ editarCurso():', codigo);
    const curso = cursosData.find(c => c.cur_codigo === codigo);
    if (!curso) return;

    // 1. ESTA ES LA LÍNEA CLAVE QUE FALTABA O FALLABA:
    // Guardamos el código original en el input oculto
    const hiddenInput = document.getElementById('cursoEditCodigo');
    if (hiddenInput) {
        hiddenInput.value = curso.cur_codigo; 
    } else {
        console.error("❌ Error: No se encontró el input hidden 'cursoEditCodigo' en el HTML");
    }

    // 2. Rellenar el resto del formulario
    document.getElementById('cursoNivel').value = curso.cur_nivel;
    document.getElementById('cursoLetra').value = curso.cur_letra;
    document.getElementById('cursoTaller').value = curso.tal_codigo;
    document.getElementById('cursoCantidadAlumnos').value = curso.cur_cantidad_alumnos;

    document.querySelector('#cursoModal .modal-title').textContent = 'Editar Curso';
    PanolApp.openModal('cursoModal');
}

function verGruposCurso(curCodigo) {
    PanolApp.switchTab('talleresTabsContainer', 2);
    filtrarGruposPorCurso(curCodigo);
}

// =============================================
// GESTIÓN DE GRUPOS
// =============================================

async function cargarGrupos() {
    console.log('📥 cargarGrupos() iniciando...');
    try {
        const response = await PanolApp.fetchAPI('/talleres/grupos');
        if (response) {
            gruposData = response;
            console.log('✅ Grupos cargados:', gruposData.length);
            console.log('🔍 Datos de grupos:', gruposData); // ← AGREGAR
            console.log('🚀 Llamando a renderGruposTable()...'); // ← AGREGAR
            renderGruposTable();
            console.log('✅ renderGruposTable() terminó'); // ← AGREGAR
        }
    } catch (error) {
        console.error('❌ Error cargando grupos:', error);
        PanolApp.showToast('Error al cargar grupos', 'error');
    }
}

function renderGruposTable() {
    console.log('🎨 renderGruposTable() - Renderizando grupos por curso...');
    const container = document.getElementById('gruposContainer');
    if (!container) {
        console.error('❌ Container #gruposContainer NO encontrado');
        return;
    }

    // Si no hay grupos
    if (!gruposData || gruposData.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #6c757d;">
                <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">📚 No hay grupos registrados</p>
                <p>Crea cursos primero para poder agregar grupos de trabajo</p>
            </div>
        `;
        return;
    }

    // Agrupar grupos por curso
    const gruposPorCurso = {};
    gruposData.forEach(grupo => {
        const cursoKey = grupo.cur_codigo;
        if (!gruposPorCurso[cursoKey]) {
            gruposPorCurso[cursoKey] = {
                curso_nombre: grupo.curso_nombre,
                taller_nombre: grupo.taller_nombre,
                grupos: []
            };
        }
        gruposPorCurso[cursoKey].grupos.push(grupo);
    });

    console.log('📊 Grupos agrupados por curso:', Object.keys(gruposPorCurso).length, 'cursos');

    // Generar HTML por secciones
    let html = '';

    Object.keys(gruposPorCurso).forEach(cursoKey => {
        const cursoInfo = gruposPorCurso[cursoKey];
        const grupos = cursoInfo.grupos;

        html += `
            <div class="curso-section" data-curso="${cursoKey}" style="margin-bottom: 2rem;">
                <!-- Header del curso -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 1rem 1.5rem; 
                            border-radius: 8px 8px 0 0;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem;">📚 ${cursoInfo.curso_nombre}</h3>
                        <p style="margin: 0.25rem 0 0 0; opacity: 0.9; font-size: 0.9rem;">${cursoInfo.taller_nombre}</p>
                    </div>
                    <span class="badge" style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; font-size: 1rem;">
                        ${grupos.length} ${grupos.length === 1 ? 'grupo' : 'grupos'}
                    </span>
                </div>
                
                <!-- Tabla de grupos del curso -->
                <div class="table-container" style="margin-top: 0; border-radius: 0 0 8px 8px; border-top: none;">
                    <table class="grupos-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Nombre</th>
                                <th>Integrantes</th>
                                <th>Estado Préstamo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${grupos.map(grupo => `
                                <tr class="grupo-row" data-grupo-nombre="${grupo.gru_nombre.toLowerCase()}" data-grupo-numero="${grupo.gru_numero}">
                                    <td><strong>#${grupo.gru_numero}</strong></td>
                                    <td>${grupo.gru_nombre}</td>
                                    <td>
                                        <span class="badge ${(grupo.cantidad_integrantes || 0) >= 3 ? 'badge-success' : 'badge-warning'}">
                                            ${grupo.cantidad_integrantes || 0}/3
                                        </span>
                                    </td>
                                    <td>
                                        ${grupo.tiene_prestamo ?
                '<span class="badge badge-success">✓ Con Préstamo</span>' :
                '<span class="badge badge-secondary">Sin Préstamo</span>'
            }
                                    </td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="btn-icon" title="Ver integrantes" onclick="verIntegrantesGrupo(${grupo.gru_id})">👥</button>
                                            <button class="btn-icon" title="Editar" onclick="editarGrupo(${grupo.gru_id})">✏️</button>
                                            <button class="btn-icon" title="Desactivar" onclick="eliminarGrupo(${grupo.gru_id})">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log('✅ Grupos renderizados por curso');

    // Configurar búsqueda que funcione en todas las secciones
    configurarBusquedaGrupos();
}



// Nueva función para búsqueda en grupos
function configurarBusquedaGrupos() {
    const searchInput = document.getElementById('searchGrupos');
    if (!searchInput) return;

    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        // Obtener todas las filas de grupos
        const grupoRows = document.querySelectorAll('.grupo-row');
        const cursoSections = document.querySelectorAll('.curso-section');

        if (!searchTerm) {
            // Mostrar todo si no hay búsqueda
            grupoRows.forEach(row => row.style.display = '');
            cursoSections.forEach(section => section.style.display = '');
            return;
        }

        // Filtrar grupos
        grupoRows.forEach(row => {
            const nombre = row.dataset.grupoNombre;
            const numero = row.dataset.grupoNumero;

            if (nombre.includes(searchTerm) || numero.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Ocultar secciones de cursos sin grupos visibles
        cursoSections.forEach(section => {
            const visibleRows = section.querySelectorAll('.grupo-row:not([style*="display: none"])');
            if (visibleRows.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
            }
        });
    });
}

async function guardarGrupo() {
    console.log('👥 guardarGrupo() iniciando...');

    const numeroInput = document.getElementById('grupoNumero');
    const nombreInput = document.getElementById('grupoNombre');
    const cursoInput = document.getElementById('grupoCurso');

    if (!numeroInput || !nombreInput || !cursoInput) {
        console.error('❌ ERROR: Elementos del formulario de grupo no encontrados');
        PanolApp.showToast('Error: Elementos del formulario no encontrados', 'error');
        return;
    }

    const grupoNumero = numeroInput.value;
    const grupoNombre = nombreInput.value.trim();
    const grupoCurso = cursoInput.value;

    console.log('📦 Datos del grupo:', { grupoNumero, grupoNombre, grupoCurso });

    if (!grupoNumero || !grupoNombre || !grupoCurso) {
        console.warn('⚠️ Validación falló: campos vacíos');
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

    console.log('📡 Enviando grupo:', grupo);

    try {
        const response = await PanolApp.fetchAPI('/grupos', 'POST', grupo);

        if (response) {
            console.log('✅ Grupo creado');
            PanolApp.showToast('Grupo creado exitosamente', 'success');
            PanolApp.closeModal('grupoModal');
            cargarGrupos();
        }
    } catch (error) {
        console.error('❌ Error guardando grupo:', error);
        PanolApp.showToast('Error al guardar grupo', 'error');
    }
}

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

function editarGrupo(grupoId) {
    console.log('✏️ editarGrupo():', grupoId);
    const grupo = gruposData.find(g => g.gru_id === grupoId);
    if (!grupo) return;

    document.getElementById('grupoCurso').value = grupo.cur_codigo;
    document.getElementById('grupoNumero').value = grupo.gru_numero;
    document.getElementById('grupoNombre').value = grupo.gru_nombre;

    document.querySelector('#grupoModal .modal-title').textContent = 'Editar Grupo';
    PanolApp.openModal('grupoModal');
}

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
// ELIMINAR - Talleres, Cursos, Grupos
// =============================================

async function eliminarTaller(codigo) {
    if (!confirm(`¿Está seguro de eliminar el taller "${codigo}"?\n\n⚠️ Esta acción eliminará también:\n- Todos los cursos asociados\n- Todos los grupos asociados\n\nEsta acción NO se puede deshacer.`)) {
        return;
    }
    
    try {
        console.log('🗑️ Eliminando taller:', codigo);
        
        const response = await PanolApp.fetchAPI(`/talleres/${codigo}`, 'DELETE');
        
        console.log('✅ Respuesta del servidor:', response);
        
        if (response && response.success !== false) {
            console.log('✅ Taller eliminado exitosamente');
            PanolApp.showToast('Taller eliminado exitosamente', 'success');
            
            // Recargar todos los datos
            console.log('🔄 Recargando datos...');
            await cargarTalleres();
            await cargarCursos();
            await cargarGrupos();
            console.log('✅ Datos recargados');
        } else {
            console.error('❌ Error: respuesta inválida del servidor');
            PanolApp.showToast('Error al eliminar taller', 'error');
        }

    } catch (error) {
        console.error('❌ Error eliminando taller:', error);
        PanolApp.showToast('Error al eliminar taller. Puede tener cursos asociados.', 'error');
    }
}

async function eliminarCurso(codigo) {
    if (!confirm(`¿Está seguro de eliminar el curso "${codigo}"?\n\n⚠️ Esta acción eliminará también:\n- Todos los grupos asociados\n- Las asignaciones de alumnos\n\nEsta acción NO se puede deshacer.`)) {
        return;
    }

    try {
        console.log('🗑️ Eliminando curso:', codigo);
        await PanolApp.fetchAPI(`/talleres/cursos/${codigo}`, 'DELETE');
        PanolApp.showToast('Curso eliminado exitosamente', 'success');

        // Recargar cursos y grupos
        cargarCursos();
        cargarGrupos();

    } catch (error) {
        console.error('❌ Error eliminando curso:', error);
        PanolApp.showToast('Error al eliminar curso. Puede tener grupos o alumnos asociados.', 'error');
    }
}

async function eliminarGrupo(id) {
    const grupo = gruposData.find(g => g.gru_id === id);
    const nombreGrupo = grupo ? grupo.gru_nombre : `Grupo ${id}`;

    if (!confirm(`¿Está seguro de desactivar el grupo "${nombreGrupo}"?\n\nEl grupo quedará inactivo pero no se eliminará de la base de datos.`)) {
        return;
    }

    try {
        console.log('🗑️ Desactivando grupo:', id);
        await PanolApp.fetchAPI(`/talleres/grupos/${id}`, 'DELETE');
        PanolApp.showToast('Grupo desactivado exitosamente', 'success');

        // Recargar grupos
        cargarGrupos();

    } catch (error) {
        console.error('❌ Error desactivando grupo:', error);
        PanolApp.showToast('Error al desactivar grupo. Puede tener un préstamo activo.', 'error');
    }
}

// Función para refrescar todo manualmente
function recargarTodo() {
    console.log('🔄 Recargando todos los datos...');
    cargarTalleres();
    cargarCursos();
    cargarGrupos();
    PanolApp.showToast('Datos actualizados', 'success');
}

console.log('✅ TALLERES.JS: Archivo cargado completamente');

function verAlumnosCurso(curCodigo) {
    // Redirigir a la página de alumnos con filtro
    window.location.href = `alumnos.html?curso=${curCodigo}`;
}


// =============================================
// INICIALIZACIÓN
// =============================================

console.log('🔄 TALLERES.JS: Registrando DOMContentLoaded...');

document.addEventListener('DOMContentLoaded', function () {
    console.log('');
    console.log('🎬 ═══════════════════════════════════════');
    console.log('🚀 TALLERES.JS: DOMContentLoaded EJECUTÁNDOSE');
    console.log('═══════════════════════════════════════');

    // Cargar datos iniciales
    console.log('📊 Cargando datos iniciales...');
    cargarTalleres();
    cargarCursos();
    cargarGrupos();

    // Event listeners de formularios
    console.log('');
    console.log('🎯 Buscando formularios...');

    const tallerForm = document.getElementById('tallerForm');
    console.log('  - #tallerForm:', tallerForm ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');

    if (tallerForm) {
        console.log('  - Registrando event listener de submit...');
        tallerForm.addEventListener('submit', function (e) {
            console.log('');
            console.log('⚡ EVENTO SUBMIT CAPTURADO EN #tallerForm');
            e.preventDefault();
            console.log('✋ preventDefault() ejecutado');
            guardarTaller();
        });
        console.log('  - ✅ Event listener registrado exitosamente');
    } else {
        console.error('  - ❌ NO SE PUDO REGISTRAR: Formulario no existe');
    }

    const cursoForm = document.getElementById('cursoForm');
    console.log('  - #cursoForm:', cursoForm ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');

    if (cursoForm) {
        cursoForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('⚡ EVENTO SUBMIT CAPTURADO EN #cursoForm');
            guardarCurso();
        });
    }

    const grupoForm = document.getElementById('grupoForm');
    console.log('  - #grupoForm:', grupoForm ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO');

    if (grupoForm) {
        grupoForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('⚡ EVENTO SUBMIT CAPTURADO EN #grupoForm');
            guardarGrupo();
        });
    }

    // Limpiar formularios al abrir modales
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                const form = this.querySelector('form');
                if (form) form.reset();
            }
        });
    });


    

    console.log('');
    console.log('✅ INICIALIZACIÓN COMPLETA');
    console.log('═══════════════════════════════════════');
    console.log('');
});

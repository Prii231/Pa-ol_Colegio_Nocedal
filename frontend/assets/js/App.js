/* =============================================
   SISTEMA DE GESTIÓN DE PAÑOL - NOCEDAL
   JavaScript Compartido
   CONFIGURADO PARA: Node.js + Express + Oracle
   ============================================= */

// Estado global de la aplicación
const appState = {
    currentUser: null,
    apiUrl: 'http://localhost:3000/api', // ← URL del backend
};

// =============================================
// AUTENTICACIÓN
// =============================================

// Verificar si el usuario está autenticado
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
        return false;
    }
    if (user) {
        appState.currentUser = JSON.parse(user);
        updateUserInfo();
    }
    return true;
}

// Actualizar información del usuario en el header
function updateUserInfo() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && appState.currentUser) {
        userNameElement.textContent = appState.currentUser.nombre;
    }
}

// Cerrar sesión
function logout() {
    if (confirm('¿Desea cerrar sesión?')) {
        localStorage.removeItem('currentUser');
        appState.currentUser = null;
        window.location.href = 'login.html';
    }
}

// Login conectado al backend
async function handleLogin(rut, password) {
    try {
        const response = await fetch(`${appState.apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rut, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Guardar usuario en localStorage
            const user = {
                rut: data.rut,
                nombre: data.nombre,
                email: data.email,
                rol: data.rol,
                token: data.token
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            appState.currentUser = user;
            
            return true;
        } else {
            showToast(data.message || 'Credenciales incorrectas', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error en login:', error);
        showToast('Error de conexión con el servidor', 'error');
        return false;
    }
}

// =============================================
// NOTIFICACIONES TOAST
// =============================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.className = 'toast active toast-' + type;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// =============================================
// MODALES
// =============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Cerrar modales al hacer clic fuera
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});

// =============================================
// MENÚ RESPONSIVE
// =============================================

function setupMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    // Crear botón de menú si no existe
    let menuToggle = document.getElementById('menuToggle');
    if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.id = 'menuToggle';
        menuToggle.innerHTML = '☰';
        menuToggle.style.cssText = `
            display: none;
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 1001;
            background: white;
            border: none;
            font-size: 24px;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(menuToggle);
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Función para verificar el tamaño de pantalla
    function checkMobile() {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
            sidebar.classList.add('collapsed');
        } else {
            menuToggle.style.display = 'none';
            sidebar.classList.remove('collapsed');
        }
    }
    
    window.addEventListener('resize', checkMobile);
    checkMobile();
}

// =============================================
// TABS
// =============================================

function switchTab(tabsContainerId, index) {
    const container = document.getElementById(tabsContainerId);
    if (!container) return;
    
    const tabs = container.querySelectorAll('.tab');
    const contents = container.querySelectorAll('.tab-content');
    
    tabs.forEach((tab, i) => {
        if (i === index) {
            tab.classList.add('active');
            if (contents[i]) contents[i].classList.add('active');
        } else {
            tab.classList.remove('active');
            if (contents[i]) contents[i].classList.remove('active');
        }
    });
}

// =============================================
// BÚSQUEDA EN TABLAS
// =============================================

function setupTableSearch(searchInputId, tableId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (!searchInput || !table) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// =============================================
// VALIDACIÓN DE RUT CHILENO
// =============================================

function validarRut(rut) {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Separar número y dígito verificador
    const rutNumero = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutNumero.length - 1; i >= 0; i--) {
        suma += parseInt(rutNumero.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    let dvCalculado;
    
    if (dvEsperado === 11) {
        dvCalculado = '0';
    } else if (dvEsperado === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvEsperado.toString();
    }
    
    return dv === dvCalculado;
}

function formatearRut(rut) {
    // Eliminar todo excepto números y K
    rut = rut.replace(/[^0-9kK]/g, '');
    
    if (rut.length <= 1) return rut;
    
    // Separar dígito verificador
    const dv = rut.slice(-1);
    let numero = rut.slice(0, -1);
    
    // Formatear con puntos
    numero = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return numero + '-' + dv;
}

// =============================================
// EXPORTAR DATOS
// =============================================

function exportarTablaCSV(tableId, filename = 'datos.csv') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach(col => {
            rowData.push('"' + col.textContent.trim() + '"');
        });
        csv.push(rowData.join(','));
    });
    
    // Crear archivo y descargar
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// =============================================
// LLAMADAS A LA API - VERSIÓN MEJORADA
// =============================================

async function fetchAPI(endpoint, method = 'GET', data = null) {
    console.log('🔵 fetchAPI llamado:');
    console.log('  - Endpoint:', endpoint);
    console.log('  - Method:', method);
    console.log('  - Data:', data);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    // Agregar token si existe
    if (appState.currentUser && appState.currentUser.token) {
        options.headers['Authorization'] = `Bearer ${appState.currentUser.token}`;
    }
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
        console.log('  - Body (JSON):', options.body);
    }
    
    try {
        console.log('🔄 Enviando request a:', appState.apiUrl + endpoint);
        const response = await fetch(appState.apiUrl + endpoint, options);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            // Intentar leer el mensaje de error del backend
            let errorMessage = `Error HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('❌ Error del backend:', errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.error('❌ No se pudo parsear el error del backend');
            }
            
            if (response.status === 401) {
                // Token expirado o inválido
                showToast('Sesión expirada. Por favor, inicie sesión nuevamente.', 'error');
                setTimeout(() => {
                    logout();
                }, 2000);
                throw new Error('Sesión expirada');
            }
            
            showToast(errorMessage, 'error');
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Response data:', result);
        return result;
    } catch (error) {
        console.error('❌ Error en fetchAPI:', error);
        if (error.message !== 'Sesión expirada') {
            // Solo mostrar toast si no es un error de red que ya se manejó
            if (!error.message.includes('Error HTTP')) {
                showToast(error.message || 'Error en la comunicación con el servidor', 'error');
            }
        }
        throw error; // Re-lanzar el error para que talleres.js pueda manejarlo
    }
}

// =============================================
// FORMATEO DE DATOS
// =============================================

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL');
}

function formatearMoneda(valor) {
    if (!valor) return '$0';
    return '$' + valor.toLocaleString('es-CL');
}

function formatearPorcentaje(valor) {
    if (!valor) return '0%';
    return Math.round(valor) + '%';
}

// =============================================
// PAGINACIÓN
// =============================================

function setupPagination(containerId, items, itemsPerPage = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let currentPage = 1;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    function renderPage(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return items.slice(start, end);
    }
    
    function updatePagination() {
        // Aquí iría la lógica para actualizar los controles de paginación
    }
    
    return {
        getCurrentPage: () => renderPage(currentPage),
        nextPage: () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
                return renderPage(currentPage);
            }
        },
        prevPage: () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
                return renderPage(currentPage);
            }
        },
        goToPage: (page) => {
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                updatePagination();
                return renderPage(currentPage);
            }
        }
    };
}

// =============================================
// INICIALIZACIÓN
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧰 Sistema de Gestión de Pañol - Colegio Nocedal');
    console.log('📅 Versión 1.0 - 2025');
    console.log('🔌 API:', appState.apiUrl);
    
    // Verificar autenticación en todas las páginas excepto login
    if (!window.location.pathname.endsWith('login.html')) {
        checkAuth();
        setupMobileMenu();
    }
    
    // Actualizar año actual en footers
    const yearElements = document.querySelectorAll('.current-year');
    yearElements.forEach(el => {
        el.textContent = new Date().getFullYear();
    });
});

// =============================================
// EXPORTS (para usar en otros archivos)
// =============================================

window.PanolApp = {
    checkAuth,
    logout,
    handleLogin,
    showToast,
    openModal,
    closeModal,
    switchTab,
    setupTableSearch,
    validarRut,
    formatearRut,
    exportarTablaCSV,
    fetchAPI,
    formatearFecha,
    formatearMoneda,
    formatearPorcentaje
};
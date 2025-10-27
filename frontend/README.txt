# Guía de Integración - Archivos JavaScript

## 📁 Estructura de Archivos JavaScript

```
sistema-panol/
├── js/
│   ├── app.js              ← JavaScript compartido (YA INCLUIDO)
│   ├── dashboard.js        ← Para index.html
│   ├── talleres.js         ← Para talleres.html
│   ├── alumnos.js          ← Para alumnos.html
│   ├── inventario.js       ← Para inventario.html
│   ├── cajas.js            ← Para cajas.html
│   ├── prestamos.js        ← Para prestamos.html
│   ├── revision.js         ← Para revision.html
│   └── reportes.js         ← Para reportes.html
```

---

## 🔧 CÓMO AGREGAR LOS ARCHIVOS A CADA PÁGINA

### 1. **index.html** (Dashboard Principal)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/dashboard.js"></script>
```

**Funciones principales:**
- `cargarDashboard()` - Carga todas las métricas
- `cargarMetricas()` - Métricas principales (cajas, préstamos, items)
- `cargarResumenTalleres()` - Usa vista `v_resumen_talleres`
- `cargarPrestamosRecientes()` - Últimos 5 préstamos
- `cargarAlertas()` - Alertas del sistema
- Actualización automática cada 5 minutos

---

### 2. **talleres.html** (Gestión de Talleres y Cursos)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/talleres.js"></script>
```

**Funciones principales:**
- `cargarTalleres()` - Lista todos los talleres
- `guardarTaller(formData)` - Crear/actualizar taller
- `editarTaller(codigo)` - Editar taller existente
- `cargarCursos()` - Lista todos los cursos
- `guardarCurso(formData)` - Crear curso nuevo
- `crearGruposAutomaticos(curCodigo)` - Crea 10 grupos automáticamente
- `cargarGrupos()` - Lista grupos de trabajo
- `guardarGrupo(formData)` - Crear grupo
- `verIntegrantesGrupo(grupoId)` - Ver alumnos del grupo

**Endpoints API usados:**
- `GET /talleres`
- `POST /talleres`
- `PUT /talleres/:codigo`
- `GET /cursos`
- `POST /cursos`
- `GET /grupos`
- `POST /grupos`
- `GET /grupos/:id/integrantes`

---

### 3. **alumnos.html** (Gestión de Alumnos)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/alumnos.js"></script>
```

**Funciones principales:**
- `cargarAlumnos()` - Lista todos los alumnos
- `guardarAlumno(formData)` - Crear/actualizar alumno con validación de RUT
- `asignarAlumnoAGrupo(aluRut, gruId)` - Asigna alumno a grupo (tabla `integrantes_grupo`)
- `editarAlumno(rut)` - Editar alumno existente
- `cambiarEstadoAlumno(rut, estado)` - Cambiar entre ACTIVO/INACTIVO/EGRESADO
- `verHistorialAlumno(rut)` - Ver historial desde `historial_movimientos`
- `aplicarFiltros()` - Filtrar por taller, curso, estado
- Validación automática de RUT chileno
- Formateo automático de RUT

**Endpoints API usados:**
- `GET /alumnos`
- `POST /alumnos`
- `PUT /alumnos/:rut`
- `PUT /alumnos/:rut/estado`
- `GET /alumnos/:rut/historial`
- `GET /cursos` (para select)
- `GET /cursos/:codigo/grupos` (para select de grupos)
- `POST /grupos/integrantes` (asignación a grupo)

---

### 4. **inventario.html** (Gestión de Inventario)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/inventario.js"></script>
```

**Funciones principales:**
- `cargarInventario()` - Lista todos los items
- `guardarItem(formData)` - Crear item maestro + unidades individuales
- `verDetalleItem(codigo)` - Ver detalles completos del item
- `actualizarEstadoItem(invId, estado, obs)` - Usa `pkg_inventario.sp_actualizar_estado_item`
- `verHistorialItem(codigo)` - Historial del item
- `reportarHallazgo(codigo)` - Marcar item extraviado como encontrado
- `registrarItemFaltante(...)` - Usa `pkg_inventario.sp_registrar_item_faltante`
- `contarItemsDisponibles(codigo)` - Usa `pkg_inventario.fn_contar_items_disponibles`
- `aplicarFiltros()` - Filtrar por taller, estado, condición

**Endpoints API usados:**
- `GET /inventario`
- `POST /inventario` (crea item maestro)
- `POST /inventario/unidades` (crea unidades individuales)
- `GET /inventario/:codigo`
- `GET /inventario/:codigo/historial`
- `POST /inventario/actualizar-estado` (ejecuta package PL/SQL)
- `POST /inventario/registrar-faltante` (ejecuta package PL/SQL)
- `GET /inventario/:codigo/disponibles` (usa función PL/SQL)
- `GET /categorias`
- `GET /tipos-item`

---

### 5. **cajas.html** (Gestión de Cajas de Herramientas)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/cajas.js"></script>
```

**Funciones principales:**
- `cargarCajas()` - Lista todas las cajas
- `guardarCaja(formData)` - Crear caja nueva
- `armarCajaConComposicion(cajaCodigo, taller)` - Arma caja según `composicion_estandar`
- `buscarUnidadesDisponibles(itemCodigo, cantidad)` - Busca items disponibles
- `asignarItemACaja(cajaCodigo, invId)` - Inserta en `items_en_cajas`
- `verContenidoCaja(cajaCodigo)` - Ver items actuales de la caja
- `completarCaja(cajaCodigo)` - Completa items faltantes automáticamente
- `verComposicionEstandar()` - Muestra composición estándar por taller
- `verHistorialCaja(cajaCodigo)` - Historial de movimientos
- `aplicarFiltros()` - Filtrar por taller, estado, completitud

**Endpoints API usados:**
- `GET /cajas`
- `POST /cajas`
- `GET /cajas/:codigo/contenido`
- `GET /cajas/:codigo/historial`
- `POST /cajas/items` (asignar item a caja)
- `GET /composicion-estandar/:taller`
- `GET /inventario/:codigo/unidades-disponibles`

---

### 6. **prestamos.html** (Gestión de Préstamos Anuales)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/prestamos.js"></script>
```

**Funciones principales:**
- `cargarPrestamos()` - Lista préstamos por año
- `registrarPrestamo(formData)` - **USA `pkg_gestion_prestamos.sp_asignar_caja_anual`**
- `verificarDisponibilidadCaja(cajaCodigo)` - Usa `pkg_gestion_prestamos.fn_caja_disponible`
- `verificarGrupoSinPrestamo(grupoId)` - Usa `pkg_gestion_prestamos.fn_grupo_tiene_prestamo`
- `verDetallePrestamo(id)` - Ver detalles completos
- `procesarDevolucion(id)` - Redirige a revision.html
- `cargarGruposSinPrestamo()` - Grupos que necesitan caja
- `cargarCajasDisponibles()` - Cajas disponibles por taller
- `aplicarFiltros()` - Filtrar por taller, estado, año

**Endpoints API usados:**
- `GET /prestamos?anio=2025`
- `POST /prestamos/asignar-caja-anual` ← **Ejecuta Package PL/SQL**
- `GET /prestamos/:id`
- `GET /cajas/:codigo/disponible` (función PL/SQL)
- `GET /grupos/:id/tiene-prestamo` (función PL/SQL)
- `GET /grupos/sin-prestamo?anio=2025`
- `GET /cajas/disponibles?taller=ELEC`
- `GET /grupos/:id/integrantes`

**Package PL/SQL usado:**
```sql
pkg_gestion_prestamos.sp_asignar_caja_anual(
    p_grupo_id => :grupoId,
    p_caja_codigo => :cajaCodigo,
    p_docente_rut => :docenteRut,
    p_anio => :anio
)
```

---

### 7. **revision.html** (Revisión y Devolución)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/revision.js"></script>
```

**Funciones principales:**
- `cargarRevision()` - Carga préstamo seleccionado
- `cargarChecklistItems(cajaCodigo)` - Obtiene items de la caja
- `renderChecklist()` - Renderiza checklist interactivo
- `actualizarRevision()` - Actualiza contadores en tiempo real
- `finalizarDevolucion()` - Valida y muestra confirmación
- `confirmarDevolucionFinal()` - **USA `pkg_gestion_prestamos.sp_devolver_caja`**
- `registrarItemProblematico(problema)` - Usa `pkg_inventario.sp_registrar_item_faltante`
- `guardarBorrador()` - Guarda progreso en localStorage
- `cargarBorrador(id)` - Restaura borrador guardado
- Auto-guardado cada 2 minutos

**Endpoints API usados:**
- `GET /prestamos/:id`
- `GET /grupos/:id/integrantes`
- `GET /cajas/:codigo/contenido`
- `POST /prestamos/devolver-caja` ← **Ejecuta Package PL/SQL**
- `POST /inventario/registrar-item-faltante` (package PL/SQL)

**Package PL/SQL usado:**
```sql
pkg_gestion_prestamos.sp_devolver_caja(
    p_prestamo_id => :prestamoId,
    p_docente_rut => :docenteRut,
    p_observaciones => :observaciones
)
```

---

### 8. **reportes.html** (Reportes y Estadísticas)

Agregar **ANTES** de `</body>`:

```html
<script src="app.js"></script>
<script src="js/reportes.js"></script>
```

**Funciones principales:**
- `seleccionarReporte(tipo)` - Selecciona tipo de reporte
- `generarReporte()` - Genera el reporte seleccionado
- `generarReportePrestamos(...)` - Usa `pkg_gestion_prestamos.sp_reporte_prestamos_activos`
- `generarReporteInventario(...)` - Estado del inventario
- `generarReporteProblemas(...)` - Items problemáticos
- `generarReporteCumplimiento(...)` - Usa `fn_porcentaje_cumplimiento_grupo`
- `generarReporteEstadisticas(...)` - Usa `sp_estadisticas_taller`
- `generarReporteHistorial(...)` - Historial de movimientos
- `exportarPDF()` - Exportar a PDF
- `exportarExcel()` - Exportar a Excel
- `imprimirReporte()` - Imprimir

**Endpoints API usados:**
- `GET /reportes/prestamos?taller=&fecha_inicio=&fecha_fin=`
- `GET /reportes/inventario?taller=`
- `GET /reportes/items-problematicos?taller=&fecha_inicio=&fecha_fin=`
- `GET /reportes/cumplimiento?taller=` (usa función PL/SQL)
- `GET /reportes/estadisticas?taller=` (usa procedimiento PL/SQL)
- `GET /reportes/historial?taller=&fecha_inicio=&fecha_fin=`

**Packages PL/SQL usados:**
```sql
-- Para reporte de préstamos activos
pkg_gestion_prestamos.sp_reporte_prestamos_activos(p_taller_codigo)

-- Para estadísticas por taller
sp_estadisticas_taller(p_taller_codigo)

-- Para cumplimiento de grupos
fn_porcentaje_cumplimiento_grupo(p_grupo_id)
```

---

## 🔄 Dependencias entre Archivos

```
Todas las páginas → app.js (SIEMPRE debe estar primero)
                     ↓
         Página específica.js
```

---

## 📋 Resumen de Integración

### Orden de scripts en TODAS las páginas:

```html
<!-- Antes de </body> -->
<script src="app.js"></script>          <!-- SIEMPRE PRIMERO -->
<script src="js/[pagina].js"></script>  <!-- Script específico -->
</body>
```

### Ejemplo completo para **prestamos.html**:

```html
    <!-- Toast Notification -->
    <div id="toast" class="toast">
        <span id="toastMessage">Mensaje</span>
    </div>

    <!-- Scripts -->
    <script src="app.js"></script>
    <script src="js/prestamos.js"></script>
</body>
</html>
```

---

## ⚙️ Configuración de API

En **app.js**, actualizar la URL de la API:

```javascript
const appState = {
    currentUser: null,
    apiUrl: 'https://tu-servidor.com/api', // ← CAMBIAR AQUÍ
};
```

---

## 🔑 Funcionalidades Clave por Package PL/SQL

### **pkg_gestion_prestamos**
- ✅ `sp_asignar_caja_anual` - Usado en **prestamos.js**
- ✅ `sp_devolver_caja` - Usado en **revision.js**
- ✅ `fn_caja_disponible` - Usado en **prestamos.js**
- ✅ `fn_grupo_tiene_prestamo` - Usado en **prestamos.js**
- ✅ `sp_reporte_prestamos_activos` - Usado en **reportes.js**
- ✅ `fn_obtener_items_caja` - Puede usarse en **cajas.js**

### **pkg_inventario**
- ✅ `sp_registrar_item_faltante` - Usado en **revision.js** e **inventario.js**
- ✅ `sp_actualizar_estado_item` - Usado en **inventario.js**
- ✅ `fn_contar_items_disponibles` - Usado en **inventario.js**
- ✅ `fn_verificar_caja_completa` - Puede usarse en **cajas.js**

### **Funciones Independientes**
- ✅ `fn_porcentaje_cumplimiento_grupo` - Usado en **reportes.js**
- ✅ `sp_estadisticas_taller` - Usado en **reportes.js** y **dashboard.js**

---

## 🎯 Próximos Pasos

1. **Copiar todos los archivos .js** a la carpeta `/js/`
2. **Agregar los scripts** a cada página HTML según la tabla arriba
3. **Configurar la API URL** en app.js
4. **Implementar los endpoints REST** en el backend
5. **Probar cada módulo** individualmente
6. **Verificar integración** completa

---

## 📞 Soporte

Si encuentras errores o necesitas ayuda:
- Revisar la consola del navegador (F12)
- Verificar que app.js esté cargado primero
- Confirmar que los endpoints de API existan
- Validar que los packages PL/SQL estén compilados

---

**¡Sistema completo y listo para integrar!** 🚀
@echo off
REM =============================================
REM SCRIPT DE INICIO RÁPIDO
REM Sistema de Pañol - Colegio Nocedal
REM =============================================

echo.
echo ========================================
echo   SISTEMA DE PAÑOL - COLEGIO NOCEDAL
echo   Iniciando servicios...
echo ========================================
echo.

REM Verificar si existe Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instalar desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado: 
node --version
echo.

REM Ir a la carpeta del backend
cd backend

REM Verificar si existen las dependencias
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias...
    call npm install
    echo.
)

REM Verificar archivo .env
if not exist ".env" (
    echo [ERROR] Archivo .env no encontrado
    echo Por favor crear el archivo .env con las credenciales de Oracle
    echo.
    echo Ejemplo:
    echo DB_USER=C##Nicolas
    echo DB_PASSWORD=balu2012
    echo DB_CONNECT_STRING=localhost:1521/XE
    echo PORT=3000
    echo.
    pause
    exit /b 1
)

echo [INFO] Iniciando servidor backend...
echo.
echo Backend corriendo en: http://localhost:3000
echo API disponible en: http://localhost:3000/api
echo Health check: http://localhost:3000/api/health
echo.
echo ========================================
echo   Para detener el servidor: Ctrl+C
echo ========================================
echo.

REM Iniciar el servidor
node server.js

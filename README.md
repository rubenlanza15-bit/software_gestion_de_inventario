# Sistema de Gestión de Inventario (Prueba Técnica)

Este proyecto es una solución integral para la gestión de inventarios, implementando lógica avanzada de extracción FIFO/FEFO, control de acceso basado en roles (JWT) y visualización en tiempo real.

## 🚀 Tecnologías Utilizadas
- **Backend**: Node.js, Express.js
- **Base de Datos**: Supabase (PostgreSQL)
- **Seguridad**: JSON Web Tokens (JWT) para control de rutas y protección de la API.
- **Frontend**: HTML5, CSS3 (Glassmorphism UI), JavaScript Vainilla (Fetch API).

## ⚙️ Características Principales
1. **Autenticación Segura**: Sistema de login que genera un JWT. Solo los perfiles "Jefe de Bodega" tienen autorización para registrar salidas.
2. **Simulador FEFO (First-Expired, First-Out)**: Antes de procesar una salida, el backend calcula automáticamente de qué lotes se extraerá el medicamento basándose en la fecha de vencimiento más próxima y lo proyecta en un Grid en el frontend.
3. **Validación de Crédito**: El sistema bloquea automáticamente salidas a sucursales que tengan una deuda pendiente superior a L 5,000.
4. **Historial de Salidas Dinámico**: Panel avanzado que permite filtrar envíos por sucursal y rango de fechas. Muestra los productos exactos enviados y permite confirmar la "Recepción" marcando la fecha y el usuario responsable.

## 🛠️ Instrucciones de Instalación para Evaluadores

Para ejecutar este proyecto en su entorno local y probar todas sus funcionalidades, por favor siga estos pasos:

1. Clone este repositorio:
```bash
git clone <URL_DEL_REPO>
```

2. Instale las dependencias de Node:
```bash
npm install
```

3. **Configuración de Variables de Entorno (IMPORTANTE):**
Para facilitar la evaluación de la prueba, la base de datos de prueba en Supabase sigue activa. 
Renombre el archivo `.env.example` a `.env` o cree un archivo `.env` en la raíz del proyecto y copie el contenido exacto de `.env.example`.

4. Inicie el servidor:
```bash
npm start
```
*(El servidor correrá en `http://localhost:3000`)*

5. **Pruebe el Sistema**:
Abra la dirección `http://localhost:3000` en su navegador de preferencia. 

Puede utilizar las siguientes credenciales de prueba para el rol de **Jefe de Bodega**:
- **Correo:** admin@siman.hn
- **Contraseña:** 123456
- **Correo:** wmaldonado@siman.hn
- **Contraseña:** 123456.

Puede utilizar las siguientes credenciales de prueba para el rol de **Vendedor**:
- **Correo:** carlos@siman.hn
- **Contraseña:** 1234.

---
*Desarrollado como prueba técnica de ingeniería de software.*
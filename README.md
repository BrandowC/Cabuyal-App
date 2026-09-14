# El Cabuyal — Sistema de restaurante

Aplicación web con backend en Node/Express + PostgreSQL (Prisma) y frontend en React + Vite. Reemplaza la antigua versión de escritorio en Electron con sql.js.

## Estructura

- `server/` — API REST (Express), tiempo real (Socket.io), Postgres vía Prisma, autenticación por rol (admin, empleado, caja).
- `web/` — Frontend React (SPA + catálogo público instalable como PWA).
- `electron/` — versión de escritorio anterior, fuera del flujo de build actual (se conserva por referencia).

## Puesta en marcha (desarrollo)

1. Crear una base de datos Postgres (local o en un proveedor como Railway/Render) y copiar `server/.env.example` a `server/.env` con los valores reales. Copiar también `web/.env.example` a `web/.env` con el número de WhatsApp del restaurante.
2. Instalar dependencias:

   ```bash
   npm run install:all
   ```
3. Aplicar el esquema y cargar los datos iniciales (mesas, menú, usuario admin):

   ```bash
   cd server
   npx prisma migrate dev --name init
   npm run seed
   ```
4. Levantar backend y frontend juntos desde la raíz:

   ```bash
   npm run dev
   ```

   Backend en `http://localhost:4000`, frontend en `http://localhost:5173`.
5. Ingresar con el usuario admin sembrado (`admin` / `admin123`) y cambiar la contraseña cuanto antes (Usuarios → Contraseña).

## Roles

- **admin**: acceso completo — menú, editor visual de mesas, ventas/reportes, usuarios, domicilios.
- **caja**: mesas, ventas, domicilios, exportar reporte de ganancias (sin gestión de menú ni usuarios).
- **empleado** (mesero): solo mesas, para tomar pedidos desde el celular (pensado como PWA — "instalar" la página desde el navegador del teléfono).

## Catálogo público

`/catalogo` no requiere login: el cliente arma su pedido de domicilio, que llega de inmediato a caja/admin (tiempo real) y además abre WhatsApp con el pedido ya redactado (`VITE_WHATSAPP_NUMBER` en `web/.env`).

## Impresora de cocina

Por ahora solo registra en consola lo que se imprimiría (`PRINTER_ENABLED` sin definir). Cuando tengas la impresora térmica ESC/POS, en `server/.env` configura:

```
PRINTER_ENABLED=true
PRINTER_TYPE=network   # o "usb"
PRINTER_IP=192.168.1.50
PRINTER_PATH=/dev/usb/lp0   # solo si PRINTER_TYPE=usb
```

No requiere cambios de código — la comanda solo incluye platos de comida (excluye bebidas).

## Retención de datos

Cron diario (3:00 a.m.) borra pedidos/ventas/domicilios con más de `RETENTION_MONTHS` (8 por defecto) de antigüedad, generando antes un respaldo en Excel en `server/backups/`.

## Reportes

Desde Ventas (admin/caja) se exporta un Excel de ganancias por período (hoy/semana/mes/rango personalizado). Desde Menú (admin) se exporta el Excel de stock.

## Pruebas

```bash
cd server
npm test
```

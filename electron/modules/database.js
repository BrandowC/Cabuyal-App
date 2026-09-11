const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let db = null

function getDBPath() {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'cabuyal.db')
}

function initDB() {
  const initSqlJs = require('sql.js')
  initSqlJs().then((SQL) => {
    const dbPath = getDBPath()
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
    } else {
      db = new SQL.Database()
    }
    crearTablas()
    console.log('✅ Base de datos lista en:', dbPath)
  })
}

function crearTablas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS mesas (
      id INTEGER PRIMARY KEY,
      numero INTEGER UNIQUE NOT NULL,
      capacidad INTEGER DEFAULT 4,
      zona TEXT DEFAULT '',
      estado TEXT DEFAULT 'libre',
      mesero TEXT DEFAULT ''
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT NOT NULL,
      precio REAL NOT NULL,
      descripcion TEXT DEFAULT '',
      disponible INTEGER DEFAULT 1
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER NOT NULL,
      menu_id INTEGER NOT NULL,
      nombre_plato TEXT NOT NULL,
      categoria TEXT DEFAULT '',
      precio REAL NOT NULL,
      cantidad INTEGER DEFAULT 1,
      notas TEXT DEFAULT '',
      estado TEXT DEFAULT 'pendiente',
      fecha TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (mesa_id) REFERENCES mesas(id),
      FOREIGN KEY (menu_id) REFERENCES menu(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mesa_id INTEGER NOT NULL,
      total REAL NOT NULL,
      mesero TEXT DEFAULT '',
      fecha TEXT DEFAULT (datetime('now','localtime'))
    );
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS domicilios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      direccion TEXT NOT NULL,
      pedido TEXT NOT NULL,
      total REAL DEFAULT 0,
      estado TEXT DEFAULT 'pendiente',
    fecha TEXT DEFAULT (datetime('now','localtime'))
  );
`)
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT DEFAULT 'mesero'
    );
  `)

  // Mesas reales de El Cabuyal
  const count = db.exec('SELECT COUNT(*) as c FROM mesas')[0]?.values[0][0]
  if (count === 0) {
    const mesas = [
      ...Array.from({length: 7}, (_, i) => [i+1,  4, 'Casa']),
      ...Array.from({length: 3}, (_, i) => [i+8,  4, 'Salón 1']),
      ...Array.from({length: 2}, (_, i) => [i+11, 4, 'Salón Madera']),
      ...Array.from({length: 5}, (_, i) => [i+13, 4, 'Salón 2']),
      [18, 4, 'Sombrilla 1'],
      [19, 4, 'Sombrilla 2'],
    ]
    for (const [numero, capacidad, zona] of mesas) {
      db.run('INSERT INTO mesas (numero, capacidad, zona) VALUES (?, ?, ?)', [numero, capacidad, zona])
    }
  }

  // Menú real de El Cabuyal
  const countMenu = db.exec('SELECT COUNT(*) as c FROM menu')[0]?.values[0][0]
  if (countMenu === 0) {
    const comidas = [
      ['COSTILLAS BBQ', 'Parrilla', 22000],
      ['PARRILLADA', 'Parrilla', 24000],
      ['CHURRASCO', 'Parrilla', 28000],
      ['FILET MIGNON', 'Parrilla', 32000],
      ['PUNTA DE ANCA', 'Parrilla', 40000],
      ['PICADA', 'Parrilla', 40000],
      ['BROCHETA DE POLLO', 'Pollo', 16000],
      ['ALITAS BBQ', 'Pollo', 15000],
      ['PECHUGA ASADA', 'Pollo', 23000],
      ['PECHUGA GRATINADA', 'Pollo', 27000],
      ['PECHUGA CABUYAL', 'Pollo', 28000],
      ['PECHUGA EN SALSA CON CAMARON', 'Pollo', 30000],
      ['LASAGNA DE POLLO', 'Lasagna', 22000],
      ['LASAGNA MIXTA', 'Lasagna', 25000],
      ['SALCHIPAPA TRADICIONAL', 'Rápidos', 9000],
      ['SALCHIPAPA MIXTA', 'Rápidos', 18000],
      ['PERRO TRADICIONAL', 'Rápidos', 9000],
      ['PERRO LOCO', 'Rápidos', 17000],
      ['TACO CABUYAL', 'Rápidos', 18000],
      ['CAJITA FELIZ', 'Rápidos', 16000],
      ['HAMBURGUESA SENCILLA', 'Hamburguesas', 11000],
      ['HAMBURGUESA CON TODO', 'Hamburguesas', 22500],
      ['PAPA FRANCESA', 'Adiciones', 4000],
      ['PORCION PATACON', 'Adiciones', 4000],
      ['PORCION ARROZ', 'Adiciones', 2000],
      ['PORCION ENSALADA', 'Adiciones', 2000],
      ['PORCION CARNE DE HAMBURGUESA', 'Adiciones', 4000],
      ['HUEVO', 'Adiciones', 1000],
      ['JALAPENOS', 'Adiciones', 1000],
      ['PEPINILLO', 'Adiciones', 1000],
      ['GUACAMOLE', 'Adiciones', 1000],
      ['MAIZ EN SALSA', 'Adiciones', 1000],
      ['PINA', 'Adiciones', 1000],
      ['JAMON', 'Adiciones', 1000],
      ['TOCINETA', 'Adiciones', 1500],
      ['SALSA CABUYAL', 'Salsas', 1500],
      ['SALSA QUESO', 'Salsas', 1500],
    ]
    const bebidas = [
      ['SODA', 'Bebidas', 3000],
      ['SODA CON LIMON', 'Bebidas', 3500],
      ['SODA SABORIZADA', 'Bebidas', 10000],
      ['LIMONADA CEREZADA', 'Limonadas', 10000],
      ['LIMONADA HIERBABUENA', 'Limonadas', 10000],
      ['LIMONADA DE COCO', 'Limonadas', 12000],
      ['MALTEADA MACADAMIA', 'Malteadas', 12000],
      ['MALTEADA LULO', 'Malteadas', 12000],
      ['MALTEADA TRES LECHES', 'Malteadas', 12000],
      ['MARACUYA JARRA (PEQUEÑA)', 'Jarras', 10000],
      ['MARACUYA JARRA (GRANDE)', 'Jarras', 15000],
      ['CHOLUPA JARRA (PEQUEÑA)', 'Jarras', 10000],
      ['CHOLUPA JARRA (GRANDE)', 'Jarras', 15000],
      ['COCA COLA PERSONAL', 'Gaseosas', 4000],
      ['COCA COLA 1.5 LT', 'Gaseosas', 8000],
      ['COCA COLA 3 LT', 'Gaseosas', 12000],
      ['CUATRO', 'Gaseosas', 8000],
      ['GINGER', 'Gaseosas', 8000],
      ['AGUA EN BOTELLA', 'Bebidas', 4000],
      ['AGUILA / POKER / AGUILA LIGHT', 'Cervezas', 3500],
      ['CLUB COLOMBIA DORADA', 'Cervezas', 5000],
      ['MICHELADA', 'Cervezas', 5000],
    ]
    for (const [nombre, categoria, precio] of [...comidas, ...bebidas]) {
      db.run('INSERT INTO menu (nombre, categoria, precio) VALUES (?, ?, ?)', [nombre, categoria, precio])
    }
  }

  // Usuario admin por defecto
  const admins = db.exec("SELECT COUNT(*) as c FROM usuarios WHERE rol='admin'")[0]?.values[0][0]
  if (admins === 0) {
    db.run(
      "INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?, ?, ?, ?)",
      ['Administrador', 'admin', 'admin123', 'admin']
    )
  }

  saveDB()
}

function saveDB() {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(getDBPath(), Buffer.from(data))
}

function getDB() {
  return db
}

module.exports = { initDB, getDB, saveDB }
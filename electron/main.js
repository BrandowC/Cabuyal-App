

const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      sandbox: false,
    },
    show: false,
  })

  if (isDev) {
    const tryLoad = () => {
      win.loadURL('http://localhost:5173').catch(() => setTimeout(tryLoad, 500))
    }
    tryLoad()
    win.webContents.openDevTools()
  } else {
    win.loadURL(`file://${app.getAppPath()}/dist/index.html`)
    win.webContents.openDevTools()
  }

  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(() => {
  const { initDB } = require('./modules/database.js')
  initDB()
  setTimeout(() => {
    require('./modules/mesas.js')
    require('./modules/pedidos.js')
    require('./modules/menu.js')
    require('./modules/ventas.js')
    require('./modules/excel.js')
    require('./modules/domicilios.js')
    createWindow()
  }, 1000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
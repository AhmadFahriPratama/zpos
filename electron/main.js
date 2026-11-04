/**
 * zPos Desktop — Electron main process
 * ------------------------------------
 * Menjalankan server zPos (Next.js standalone) sebagai proses anak
 * lalu menampilkan aplikasi di jendela desktop. Database SQLite
 * disimpan di folder userData agar aman ditulis setelah instalasi.
 *
 * Build:  next build → electron-builder (lihat electron-builder.yml)
 * Struktur runtime (resources):
 *   app/server.js          → Next standalone server
 *   app/.next/static/...   → aset statis Next
 *   app/public/...         → aset publik (foto produk, logo)
 *   db/custom.db           → database SQLite kosong (schema siap)
 */
const { app, BrowserWindow, Menu, shell } = require('electron')
const { spawn } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 7788
const HOST = '127.0.0.1'
const APP_URL = `http://${HOST}:${PORT}`

let serverProc = null
let win = null

/** Siapkan database SQLite di folder userData (copy saat first-run) */
function prepareDatabase() {
  const userData = app.getPath('userData')
  const dest = path.join(userData, 'zpos.db')
  const src = path.join(process.resourcesPath, 'db', 'custom.db')
  try {
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      console.log('[zpos] database disalin ke', dest)
    }
  } catch (err) {
    console.error('[zpos] gagal menyiapkan database:', err)
  }
  return dest
}

/** Jalankan Next standalone server dengan binary Electron sebagai Node */
function startServer(dbPath) {
  const serverPath = path.join(process.resourcesPath, 'app', 'server.js')
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: 'production',
    ELECTRON_NO_ATTACH_CONSOLE: '1',
    PORT: String(PORT),
    HOSTNAME: HOST,
    // Prisma SQLite — forward slash agar aman di Windows
    DATABASE_URL: 'file:' + dbPath.replace(/\\/g, '/'),
  }
  serverProc = spawn(process.execPath, [serverPath], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  serverProc.stdout.on('data', (d) => console.log('[server]', d.toString().trim()))
  serverProc.stderr.on('data', (d) => console.error('[server:err]', d.toString().trim()))
  serverProc.on('exit', (code) => console.log('[zpos] server keluar dengan kode', code))
}

/** Tunggu server merespons sebelum membuka jendela */
function waitForServer(retries = 240) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = http.get({ host: HOST, port: PORT, path: '/api/bootstrap', timeout: 2500 }, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) return resolve()
        retry(n)
      })
      req.on('error', () => retry(n))
      req.on('timeout', () => {
        req.destroy()
        retry(n)
      })
    }
    const retry = (n) => {
      if (n <= 0) return reject(new Error('Server zPos tidak merespons'))
      setTimeout(() => attempt(n - 1), 500)
    }
    attempt(retries)
  })
}

function createWindow() {
  win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 680,
    show: false,
    backgroundColor: '#f4f4f5',
    title: 'zPos',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })

  Menu.setApplicationMenu(null)

  // Buka link eksternal di browser default, bukan di jendela aplikasi
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Splash sambil server siap (first-run: seeding data demo)
  win.loadURL(
    'data:text/html;charset=utf-8,' +
      encodeURIComponent(
        `<!doctype html><html><head><meta charset="utf-8"><style>
          body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
               background:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b}
          .logo{width:64px;height:64px;border-radius:18px;background:#18181b;color:#fff;display:flex;
                align-items:center;justify-content:center;font-size:30px;font-weight:800;animation:pulse 1.4s ease-in-out infinite}
          p{margin-top:18px;font-size:14px;color:#71717a}
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(.96)}}
        </style></head><body>
          <div class="logo">z</div><p>Menyiapkan zPos… server lokal sedang berjalan</p>
        </body></html>`
      )
  )

  waitForServer()
    .then(() => {
      if (win && !win.isDestroyed()) {
        win.loadURL(APP_URL)
        win.once('ready-to-show', () => win.show())
      }
    })
    .catch((err) => {
      console.error(err)
      if (win && !win.isDestroyed()) {
        win.loadURL(
          'data:text/html;charset=utf-8,' +
            encodeURIComponent('<h2 style="font-family:sans-serif">Gagal memulai server zPos. Coba jalankan ulang aplikasi.</h2>')
        )
        win.show()
      }
    })

  win.on('closed', () => {
    win = null
  })
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('id.zpos.desktop')
    const dbPath = prepareDatabase()
    startServer(dbPath)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProc && !serverProc.killed) {
    try {
      serverProc.kill()
    } catch (_) {}
  }
})

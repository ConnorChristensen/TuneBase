// import electron into the app and BrowserWindow variables
const {app, BrowserWindow} = require('electron')

const path = require('path')
const url = require('url')

let win

function createWindow() {
  // create the browser window without a top bar
  win = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hidden'})

  // load the index.html of the app
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file',
    slashes: true
  }))

  // open up the development tools
  // win.webContents.openDevTools()

  win.on('closed', () => {
    // dereference our closed window, we don't need it
    win = null
  })
}


app.on('ready', createWindow)

app.on('window-all-closed', () => {
  // if you are not in mac, quit the app when closing
  // all the windows
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // if you are on a mac, open a window when you click
  // on the app if there aren't already open windows
  if (win === null) {
    createWindow()
  }
})

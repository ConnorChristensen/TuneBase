/*
This is the starting file for the electron app. This is where the setup for the
windows and the behaviour of the app is defined.
*/

// import electron into the app and BrowserWindow variables
const {app, BrowserWindow, Menu} = require('electron')

const path = require('path')
const url = require('url')

// Menu template
const template = [
  {
    label: 'Edit',
    submenu: []
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() { require('electron').shell.openExternal('https://electronjs.org') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  // add this to the begining of the array
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  })

  // Add speech elements to the sub-menu on edit
  template[1].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  )

  // Replace the window menu on mac with more options
  template[3].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

let win

function createWindow() {
  // create the browser window without a top bar
  win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    minWidth: 300,
    minHeight: 300,
    // turn on node
    webPreferences: {
      nodeIntegration: true
   }
  })

  // load the index.html of the app
  win.loadURL(url.format({
    pathname: path.join(__dirname, './home/home.html'),
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
  // if you are not on a mac, quit the app when closing
  // all the windows
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // add in the menu
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // if you are on a mac, open a window when you click
  // on the app if there aren't already open windows
  if (win === null) {
    createWindow()
  }
})

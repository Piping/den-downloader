const electron = require('electron');
const {app, BrowserWindow, ipcMain, dialog} = electron;
const path = require('path');
const url = require('url');

const child_process = require('child_process');
const rp = require('request-promise');
const removeValue = require('remove-value');
const proc = require('./src/modules/process');

let win;

var jar_c = rp.jar();
var jar_t = rp.jar();

let loginAuthenticatorWindow;
let loginSender;
let downloadRequestWindow;
let downloadSender;
let contentSender;

createLoginBackground = () => {
  loginAuthenticatorWindow = new BrowserWindow({ show: false });
  loginAuthenticatorWindow.loadURL(url.format({
    pathname: path.join(__dirname,'src','external','main.html'),
    protocol: 'file:',
    slashes: true
  }));
  ipcMain.on('login-window-ready', (event, arg) => {
    loginSender = event.sender;
  });
}

createDownloadBackground = () => {
  downloadRequestWindow = new BrowserWindow({ show: false });
  downloadRequestWindow.loadURL(url.format({
    pathname: path.join(__dirname,'src','external','download.html'),
    protocol: 'file:',
    slashes: true
  }));
  ipcMain.on('download-window-ready', (event, arg) => {
    downloadSender = event.sender;
  });
}

ipcMain.on('login-submit', (event, arg) => {
  contentSender = event.sender;
  loginSender.send('login-authentication', arg);
  ipcMain.on('courses-list', (e, a) => {
    courseInformationArchive = a.payload.courses;
    contentSender.send('courses-list', a.payload.courses);
    jar_c = a.jars.jar_c;
    jar_t = a.jars.jar_t;
  });
  ipcMain.on('content-list', (e, a) => {
    contentSender.send('content-list', a.payload);
    jar_c = a.jars.jar_c;
    jar_t = a.jars.jar_t;
  });
  ipcMain.on('content-unavailable-error', (e, a) => {
    contentSender.send('content-list', a.payload);
  });
  ipcMain.on('login-error', (e, a) => {
    contentSender.send('login-failure');
  });
});

var courseInformationArchive = Array();
var contentRequestQueue = Array();
ipcMain.on('content-request', (event,arg) => {
  // content request retry
});

ipcMain.on('download-request', (event, arg) => {
  downloadSender.send('download-item', { obj: arg, jar: jar_c });
  ipcMain.on('download-success', (e, a) => {
    contentSender.send('download-finished', a);
  });
  ipcMain.on('download-failure', (e, a) => {
    contentSender.send('download-finished', a);
  });
  ipcMain.on('download-progress', (e, a) => {
    contentSender.send('download-progress', a);
  });
});

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 500,
    minWidth: 350,
    useContentSize: true,
    center: true,
    backgroundColor: '#fff',
    darkTheme: true,
    frame: true,
    resizable: true,
    movable: true,
    transparent: false,
    hasShadow: false,
    titleBarStyle: 'default',
    webPreferences: {
      devTools: true,
      defaultFontSize: 14,
    }
  });
  win.loadURL(url.format({
    pathname: path.join(__dirname,'src','login','login.html'),
    protocol: 'file:',
    slashes: true
  }));
  win.on('closed', () => {
    win = null;
    loginAuthenticatorWindow = null;
    downloadRequestWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  createLoginBackground();
  createDownloadBackground();
});

app.on('window-all-closed', () => {app.exit()});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
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

ipcMain.on('login-submit', (event, arg) => {
  const s_cred = JSON.stringify(arg);
  const command = 'node';
  var file = path.join(__dirname,'src','external','main.js');
  const parameters =  [file,s_cred];
  const environment = process.env;
  environment.PATH += ':/usr/local/bin/:/sbin:/usr/sbin';
  const child = child_process.spawn(command,parameters,{
    shell: false,
    env: environment,
    stdio: ['ignore','ignore','ignore','ipc']
  }).on('error', (error) => {
    dialog.showErrorBox('Spawn Error',JSON.stringify(error));
  });
  child.on('message', (message) => {
    message = JSON.parse(message);
    jar_c = message.jars.jar_c;
    jar_t = message.jars.jar_t;
    switch(message.event) {
      case 'courses-list':
        courseInformationArchive = message.payload.courses;
        event.sender.send('courses-list', message.payload.courses);
        break;
      case 'content-list':
        event.sender.send('content-list', message.payload);
        break;
      case 'error':
        switch(message.error.name) {
          case 'StatusCodeError':
            if(message.error.statusCode == 403)
              event.sender.send('login-failure');
            break;
          case 'ContentUnavailableError':
            event.sender.send('content-list', message.payload);
            break;
          default:
            dialog.showMessageBox({message:JSON.stringify(message)});
        }
        break;
      default:
        dialog.showMessageBox({message:JSON.stringify(message)});
    }
  });
});

var courseInformationArchive = Array();
var contentRequestQueue = Array();
ipcMain.on('content-request', (event,arg) => {
  // content request retry
});

ipcMain.on('download-request', async (event, arg) => {
  proc.downloadContent(jar_c,jar_t,arg);
});

function createWindow () {
  win = new BrowserWindow({
    width: 600,
    height: 400,
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
  win.on('closed', () => {win = null});
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {app.exit()});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
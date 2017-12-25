const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;
const path = require('path');
const url = require('url');

const rp = require('request-promise');
const auth = require('./src/modules/auth');
const info = require('./src/modules/info');
const proc = require('./src/modules/process');

var jar_c = rp.jar();
var jar_t = rp.jar();
var content_event_sender = null;
var courses_home_data = null;

let win;

ipcMain.on('content-initial-loaded', (event) => {
  content_event_sender = event.sender;
})

ipcMain.on('login-submit', async (event, arg) => {
  return await auth.authenticateCoursesDen(jar_c,arg)
  .then(async () => {
    return await info.requestCoursesHome(jar_c);
  }).then((data) => {
    courses_home_data = data;
    if(content_event_sender) {
      content_event_sender.send('login-result', {msg:'Authenticated!',type:'success'});
    } else {
      ipcMain.on('content-initial-loaded', (event) => {
        event.sender.send('login-result', {msg:'Authenticated!',type:'success'});
      });
    }
  }).catch((error) => {
    if(content_event_sender) {
      content_event_sender.send('login-result', {msg:error.message,type:'failure'});
    } else {
      ipcMain.on('content-initial-loaded', (event) => {
        event.sender.send('login-result', {msg:error.message,type:'failure'});
      });
    }
  });
});

ipcMain.on('proceed-courses', async (event) => {
  return await proc.getCourseListLink(courses_home_data)
  .then(async (link) => {
    return await info.requestCourseList(jar_c,link);
  }).then(async (data) => {
    return await proc.getCourses(data);
  }).then(async (courses) => {
    event.sender.send('courses-list', courses);
    courses.forEach(async (course,index) => {
      return await info.requestCoursePage(jar_c,course.url)
      .then(async (data) => {
        return await proc.parseCourseContent(data);
      }).then(async (content) => {
        return await proc.categorizeCourseContent(jar_c,jar_t,content);
      }).then((content) => {
        event.sender.send('content-list',{content:content,index:index});
      });
    });
  });
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
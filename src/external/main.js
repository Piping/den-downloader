const auth = require('../modules/auth');
const info = require('../modules/info');
const proc = require('../modules/process');
const rp = require('request-promise');
const { ipcRenderer } = require('electron');

var jar_c = rp.jar()
var jar_t = rp.jar();

window.onload = () => {
  ipcRenderer.send('login-window-ready');
}

ipcRenderer.on('login-authentication', (event, arg) => {
  auth.authenticateCoursesDen(jar_c,arg)
  .then(async () => {
    return await info.requestCoursesHome(jar_c);
  }).then(async (data) => {
    return await proc.getCourseListLink(data);
  }).then(async (link) => {
    return await info.requestCourseList(jar_c,link);
  }).then(async (data) => {
    return await proc.getCourses(data);
  }).then((courses) => {
    ipcRenderer.send('courses-list', {
      payload: {
        courses:courses
      },
      jars:{
        jar_c:jar_c,
        jar_t:jar_t
      }
    });
    courses.forEach(async (course,index) => {
      return await info.requestCoursePage(jar_c,course.url)
      .then(async (data) => {
        return await proc.parseCourseContent(data);
      }).then(async (content) => {
        return await proc.categorizeCourseContent(jar_c,jar_t,content);
      }).then((content) => {
        ipcRenderer.send('content-list', {
          payload: {
            content:content,
            index:index--
          },
          jars:{
            jar_c:jar_c,
            jar_t:jar_t
          }
        });
      }).catch((error) => {
        error.name = 'ContentUnavailableError';
        error.message = 'Content unavailable at this moment.';
        error.stack = String();
        var c = {
          document: [],
          video: [],
          error: error
        };
        payload = {
          content: c,
          index: index.toString()
        };
        ipcRenderer.send('content-unavailable-error', {
          error:error,
          payload:payload,
          jars:{
            jar_c:jar_c,
            jar_t:jar_t
          }
        });
      });
    });
  }).catch((error) => {
    ipcRenderer.send('login-window-ready', error);
    ipcRenderer.send('login-error', {
      error:error,
      jars:{
        jar_c:jar_c,
        jar_t:jar_t
      }
    });
  });
});
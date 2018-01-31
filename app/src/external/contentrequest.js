const info = require('../modules/info');
const proc = require('../modules/process');

var params = JSON.parse(process.argv[2]);
var course = params.course;
var index = params.index;
var jar_c = params.jar_c;
var jar_t = params.jar_t;

info.requestCoursePage(jar_c,course.url)
.then(async (data) => {
  return await proc.parseCourseContent(data);
}).then(async (content) => {
  return await proc.categorizeCourseContent(jar_c,jar_t,content);
}).then((content) => {
  process.send(JSON.stringify({
    event:'content-list',
    payload: {
      content:content,
      index:index
    }
  }));
}).catch((error) => {
  error.name = 'ContentUnavailableError';
  error.message = 'What??';
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
  process.send(JSON.stringify({event:'error',error:error,payload:payload}));
});
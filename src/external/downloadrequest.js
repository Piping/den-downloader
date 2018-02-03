const doc = require('../modules/document');
const util = require('../modules/util');
const video = require('../modules/video');
const rp = require('request-promise');

var jar_c = rp.jar();

jar_c._jar.cookies = process.argv[2];
var obj = JSON.parse(process.argv[3]);

// util.generateOutputDirectory(obj.target);
obj.list.forEach((item) => {
  if(item.type === 'doc') {
    // var out = util.generateOutputDirectory(obj.target,'doc',item.course);
    var out = obj.target;
    doc.downloadDocument(jar_c,item.link,`${out}/${item.title}.${item.ext}`)
    .then(result => process.send(JSON.stringify({result:result,id:item.id})))
    .catch(result => process.send(JSON.stringify({result:result,id:item.id})));
  } if(item.type === 'vid') {
    // var out = util.generateOutputDirectory(obj.target,'vid',item.course);
    var out = obj.target;
    item.title = item.title.replace(/[\s/]/g,'');
    video.downloadVideo(item.link,`${out}/${item.title}.${item.ext}`,item.id)
    .then(result => process.send(JSON.stringify({result:result,id:item.id})))
    .catch(result => process.send(JSON.stringify({result:result,id:item.id})));
  }
});
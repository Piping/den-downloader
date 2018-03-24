const doc = require('../modules/document');
const util = require('../modules/util');
const video = require('../modules/video');
const rp = require('request-promise');
const { ipcRenderer } = require('electron');

window.onload = () => {
  ipcRenderer.send('download-window-ready');
}

ipcRenderer.on('download-item', (event, arg) => {
  let obj = arg.obj;
  let jar_c = arg.jar;
  // util.generateOutputDirectory(obj.target);
  obj.list.forEach((item) => {
    if(item.type === 'doc') {
      // var out = util.generateOutputDirectory(obj.target,'doc',item.course);
      var out = obj.target;
      doc.downloadDocument(jar_c,item.link,`${out}/${item.title}.${item.ext}`)
      .then(result => {
        switch(result) {
          case 'success': 
            ipcRenderer.send('download-success', { result:result,id:item.id });
            break;
          case 'failure': 
            ipcRenderer.send('download-failure', { result:result,id:item.id });
            break;
          default:
            ipcRenderer.send('download-failure', { result:result,id:item.id });
            break;
        }
      })
      .catch(result => {
        ipcRenderer.send('download-failure', {result:result,id:item.id})
      });
    } if(item.type === 'vid') {
      // var out = util.generateOutputDirectory(obj.target,'vid',item.course);
      var out = obj.target;
      item.title = item.title.replace(/[\s/]/g,'');
      video.downloadVideo(item.link,`${out}/${item.title}.${item.ext}`,item.id)
      .then(result => {
        switch(result) {
          case 'success': 
            ipcRenderer.send('download-success', { result:result,id:item.id });
            break;
          case 'failure': 
            ipcRenderer.send('download-failure', { result:result,id:item.id });
            break;
          default:
            ipcRenderer.send('download-failure', { result:result,id:item.id });
            break;
        }
      })
      .catch(result => {
        ipcRenderer.send('download-failure', {result:result,id:item.id})
      });
    }
  });
});

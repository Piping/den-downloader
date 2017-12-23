const fs = require('fs');
const rp = require('request-promise');

saveDocument = (path,data) => {
  return new Promise((resolve, reject) => {
    if(data) {
      fs.writeFile(path,data,'binary',(error)=>{
        if(error) reject(error);
        resolve();
      });
    }
  });
}

downloadDocument = (jar,url,path) => {
  rp({method:'get',encoding:'binary',jar:jar,url:url
  }).then((data) => {
    saveDocument(path,data);
  })
}

module.exports = { 
  saveDocument,
  downloadDocument
}
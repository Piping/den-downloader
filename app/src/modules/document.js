const fs = require('fs');
const rp = require('request-promise');

saveDocument = (path,data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path,data,'binary',error => {
      if(error) reject('failure');
      resolve('success');
    });
  });
}

downloadDocument = (jar,url,path) => {
  return new Promise((resolve, reject) => {
    rp({method:'get',encoding:'binary',jar:jar,url:url})
    .then(async data => {
      return await saveDocument(path,data);
    })
    .then(result => resolve(result))
    .catch(error => reject('failure'));
  });
}

module.exports = { 
  saveDocument,
  downloadDocument
}
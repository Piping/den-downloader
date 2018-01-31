const fs = require('fs');
const path = require('path');

generateOutputDirectory = (dir,type,course) => {
  if(!type) {
    try {
      fs.mkdirSync(dir);
    } catch(error) { return }
    return;
  }
  var p = path.join(dir,course);
  try {
    fs.mkdirSync(p);
  } catch(error) {}
  var p = path.join(dir,course,'documents');
  if(type=='doc') {
    try {
      fs.mkdirSync(p);
      return p;
    } catch(error) { return p }
  }
  var p = path.join(dir,course,'videos');
  if(type=='vid') {
    try {
      fs.mkdirSync(p);
      return p;
    } catch(error) { return p }
  }
}

module.exports = {
  generateOutputDirectory
}
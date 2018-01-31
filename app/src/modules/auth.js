const rp = require('request-promise');

authenticateCoursesDen = (jar,cred) => {
  return new Promise((resolve, reject) => {
    rp({
      jar: jar,
      url: 'https://courses.uscden.net/d2l/lp/auth/login/login.d2l',
      method: 'post',
      formData: {
        loginPath: '/d2l/login',
        userName: cred.user,
        password: cred.pass
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'accept': 'text/html',
      }
    }).then((data) => { resolve(data) }).catch((error) => { reject(error) });
  });
}

module.exports = { 
  authenticateCoursesDen
}
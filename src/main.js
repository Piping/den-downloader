const cheerio = require('cheerio');
const child_process = require('child_process');
const fs = require('fs');
const moment = require('moment');
const prompt = require('prompt');
const request = require('request');
const rp = require('request-promise');
const unique = require('array-unique');
const video = require('./modules/video');

_getPrompt = () => {
  return new Promise((resolve, reject) => {
    prompt.colors = false;
    prompt.message = ``;
    prompt.delimiter = ``;
    prompt.start();
    prompt.get([{name:'user',description:'Username:'},{name:'pass',description:'Password:',hidden:true,replace:'*'}], (error, result) => {
      if(error) process.exit(1);
      resolve({user:result.user,pass:result.pass});
    });
  })
}

var jar_courses = rp.jar();
var jar_tools = rp.jar();

var general = {
  jar: jar_courses,
  method: 'get',
}

_getPrompt().then(async (cred) => {
  var authentication = {
    jar: jar_courses,
    url: 'https://courses.uscden.net/d2l/lp/auth/login/login.d2l',
    method: 'post',
    body: `d2l_referrer=&loginPath=%2Fd2l%2Flogin&userName=${cred.user}&password=${cred.pass}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'accept': 'text/html',
    }
  }
  return await rp(authentication);
}).then(async () => {
  general.url = 'https://courses.uscden.net/d2l/home';
  general.gzip = true;
  return await rp(general);
}).then(async (data) => {
  $ = cheerio.load(data);
  var base = $('.vui-link.d2l-link.vui-outline')['6'].attribs.href.split('/');
  var un1 = base[4];
  var un2 = base[5];
  var url = `https://courses.uscden.net/d2l/le/userprogress/${un1}/${un2}/Summary`
  general.url = url;
  return await rp(general);
}).then(async (data) => {
  var courses_id = Array();
  var courses_title = Array();
  $ = cheerio.load(data);
  $('.d2l-datalist-item').find('a').each((i,e) => {
    var id = new RegExp('courseId=.+?$');
    var title = new RegExp('CSCI.+?$');
    if(e.attribs.href) var found_id = e.attribs.href.match(id);
    if(found_id) courses_id.push(found_id[0].slice('courseId='.length));
    if(e.attribs.title) var found_title = e.attribs.title.match(title);
    if(found_title) courses_title.push(found_title[0]);
  });
  unique(courses_id);
  unique(courses_title);
  courses_title = courses_title.map((e) => { 
    e = e.split(' - ');
    return {id:e[0],term:e[1],title:e[2]}
  });
  var courses = courses_id.map((e,i) => { 
    courses_title[i].serial = e;
    courses_title[i].url = `https://courses.uscden.net/d2l/le/content/${e}/Home?itemIdentifier=toc`;
    return courses_title[i];
  });
  general.url = courses[0].url
  return await rp(general);
}).then((data) => {
  var content = Array();
  $ = cheerio.load(data);
  $('.d2l-datalist-item').find('a').each((i,e) => {
    var link = $(e).attr('href');
    if(link && link.includes('View')) {
      content.push({
        title:$(e).attr('title').split(`' - `)[0].replace(`'`,``),
        type:$(e).attr('title').split(`' - `)[1],
        url:`https://courses.uscden.net${link}`
      });
    }
  });
  const ts = moment().unix();
  child_process.execSync(`mkdir content_${ts}`);
  content.forEach((item) => {
    rp({jar:jar_courses,method:'get',url:item.url}).then(async (data) => {
      $ = cheerio.load(data);
      var dl = $('.d2l-fileviewer-pdf-pdfjs').attr('data-location');
      if(!dl) {
        var dl = $('.d2l-fileviewer').children().attr('data-location');
        if(dl) dl = `https://courses.uscden.net${dl}`;
      }
      if(!dl) {
        var vd = $('iframe').attr('src');
        if(vd) {
          vd = `https://courses.uscden.net${vd}`;
          rp({jar:jar_courses,method:'get',url:vd}).then((data) => {
            $ = cheerio.load(data);
            var body = Object();
            $('form').find('input').each((i,e) => {
                body[`${$(e).attr('name')}`] = $(e).attr('value');
            });
            return body
          }).then(async (body) => {
            await rp({jar:jar_tools,method:'get',url:`https://tools.uscden.net/mydentools/students/media/player.php`});
            return body;
          }).then(async (body) => {
            var cookie = jar_tools._jar.store.idx['tools.uscden.net']['/']['PHPSESSID'].toString().split(';')[0];
            cookie = `PHPSESSID=${cookie.split('=')[1]}`;
            return await rp({jar:jar_tools,method:'post',url:`https://tools.uscden.net/mydentools/students/media/player.php`,formData:body,headers:{cookie:cookie}});
          }).then((data) => {
            $ = cheerio.load(data);
            video.downloadVideo($('.DENVideo').next().attr('href'));
          }).catch((error) => { console.log(error.message) });
        }
      }
      if(dl) return await rp({jar:jar_courses,method:'get',url:dl,encoding:'binary'});
      else return null;
    }).then((data) => {
      if(data) {
        fs.writeFile(`content_${ts}/${item.title}.pdf`,data,'binary',(error)=>{
          if(error) return console.log(error.message);
        });
      }
    }).catch((error) => { console.log(error.message) });
  })
}).catch((error) => { console.log(error.message) });
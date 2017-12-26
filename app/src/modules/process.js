const unique = require('array-unique');
const cheerio = require('cheerio');
const rp = require('request-promise');
const doc = require('./document');
const util = require('./util');
const video = require('./video');

getCourseListLink = (data) => {
  return new Promise((resolve, reject) => {
    try {
      $ = cheerio.load(data);
      var base = $('.vui-link.d2l-link.vui-outline')['6'].attribs.href.split('/');
    } catch(error) { reject(error) }
    resolve(`https://courses.uscden.net/d2l/le/userprogress/${base[4]}/${base[5]}/Summary`);
  });
}

getCourses = (data) => {
  return new Promise((resolve, reject) => {
    try {
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
    } catch(error) { reject(error) }
    resolve(courses);
  });
}

parseCourseContent = (data) => {
  return new Promise((resolve, reject) => {
    try {
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
    } catch(error) { reject(error) }
    resolve(content);
  });
}

categorizeCourseContent = (jar_c,jar_t,c) => {
  return new Promise((resolve, reject) => {
    var content = Object();
    content.document = Array();
    content.video = Array();
    content.error = null;
    var promises = Array();
    c.forEach((item) => {
      promises.push(new Promise((resolve, reject) => {
        rp({jar:jar_c,method:'get',url:item.url}).then(async (data) => {
          $ = cheerio.load(data);
          var dl = $('.d2l-fileviewer-pdf-pdfjs').attr('data-location');
          if(!dl) {
            var dl = $('.d2l-fileviewer').children().attr('data-location');
            if(dl) dl = `https://courses.uscden.net${dl}`;
          }
          if(dl) {
            item.category = 'document';
            item.download_link = dl;
            item.extension = 'pdf';
            var re = new RegExp('([.]pdf|[.]txt|[.]html|[.]doc|[.]docx|[.]ppt|[.]pptx|[.]png|[.]jpg|[.]jpeg)');
            var found = dl.match(re);
            if(found) item.extension = found[0].slice(1);
            content.document.push(item);
            resolve(item);
          } else {
            item.category = 'video';
            await _getVideoLink(jar_c,jar_t,$).then((dl) => {
              if(dl) {
                item.download_link = dl;
                content.video.push(item);
                resolve(item);
              }
              resolve();
            }).catch((error) => {});
          }
          resolve();
        }).catch((error) => {});
      }));
    });
    Promise.all(promises).then(() => {
      content.document.sort((a,b) => { return a.title.localeCompare(b.title) });
      content.video.sort((a,b) => { return a.title.localeCompare(b.title) });
      resolve(content);
    }).catch((error) => { reject(error) });
  });
}

_getVideoLink = (jar_c,jar_t,$) => {
  return new Promise((resolve, reject) => {
    var vd = $('iframe').attr('src');
    if(vd) {
      vd = `https://courses.uscden.net${vd}`;
      rp({jar:jar_c,method:'get',url:vd}).then((data) => {
        $ = cheerio.load(data);
        var body = Object();
        $('form').find('input').each((i,e) => {
            body[`${$(e).attr('name')}`] = $(e).attr('value');
        });
        return body;
      }).then(async (body) => {
        return await rp({jar:jar_t,method:'post',url:`https://tools.uscden.net/mydentools/students/media/player.php`,formData:body});
      }).then((data) => {
        $ = cheerio.load(data);
        resolve($('.DENVideo').next().attr('href'));
      }).catch((error) => { reject(error) });
    } else reject(new Error('UnsupportedFormat'));
  });
}

downloadContent = (jar_c,jar_t,arr) => {
  var outdir = util.generateOutputDirectory('content');
  arr.forEach((item) => {
    if(item.type === 'doc')
      doc.downloadDocument(jar_c,item.link,`${outdir}/documents/${item.title}.${item.ext}`);
    if(item.type === 'vid') {
      video.downloadVideo(item.link,`${outdir}/videos/${item.title.replace(/[\s/]/g,'')}.${item.ext}`);
    }
  });
}

module.exports = {
  getCourseListLink,
  getCourses,
  parseCourseContent,
  categorizeCourseContent,
  downloadContent
}
window.$ = window.jQuery = require('jquery');
const ipcRenderer = require('electron').ipcRenderer;

window.onload = () => {
  ipcRenderer.on('login-failure', (event, arg) => {
    var header = 'Failed to Authenticate!';
    var content = 'Could not authenticate.\n';
    content += 'Please double check your credentials ';
    content += 'and try logging in again!';
    var color = 'is-danger';
    var button = document.createElement('button');
    $(button).addClass('button is-danger');
    $(button).on('click', () => window.location.href='../login/login.html');
    var icon = document.createElement('i');
    $(icon).addClass('fa fa-chevron-left');
    $(button).append(icon);
    $(button).append(message);
    var result = document.createElement('article');
    $(result).addClass(`message ${color}`);
    var result_header = document.createElement('div');
    $(result_header).addClass('message-header justify-content-start');
    if(button) $(result_header).append(button);
    var message = document.createElement('span');
    $(message).text(header);
    $(result_header).append(message);
    var result_content = document.createElement('div');
    $(result_content).addClass('message-body');
    $(result_content).text(content);
    $(result).append(result_header);
    $(result).append(result_content);
    $('#container').html('');
    $('#container').append(result);
  });
  
  var globalCourseArchive = Array();
  var globalOutputDirectory = require('path').join(__dirname,'..','..','content');
  
  
  setUpFilewatcher = () => {
    globalCourseArchive.forEach((course) => {
      var d = require('path').join(globalOutputDirectory,course.id,'documents');
      var v = require('path').join(globalOutputDirectory,course.id,'videos');
      try {
        require('fs').watch(d,checkFiles);
        require('fs').watch(v,checkFiles);
      } catch(error) {}
    });
  }

  ipcRenderer.on('courses-list', (event, arg) => {
    globalCourseArchive = arg;
    setUpFilewatcher();
    $('#container').removeClass('justify-content-center');
    $('#container').addClass('justify-content-start');
    $('#container').html('');
    var panel = document.createElement('div');
    $(panel).addClass('panel w-80');
    var panel_header = document.createElement('div');
    $(panel_header).addClass('panel-heading');
    var title = document.createElement('span');
    $(title).text('Courses');
    var folder_container = document.createElement('span')
    $(folder_container).addClass('tags has-addons is-marginless folder');
    var folder = document.createElement('span');
    $(folder).addClass('tag is-dark is-marginless');
    $(folder).text('Output Directory');
    $(folder_container).append(folder);
    $(folder_container).click(outputDirectoryOnClick);
    var tags = document.createElement('span');
    $(tags).addClass('tags has-addons is-marginless');
    var download = document.createElement('span');
    $(download).addClass('tag is-primary is-marginless')
    $(download).text('Download');
    var number = document.createElement('span');
    $(number).addClass('tag is-dark is-marginless');
    $(number).attr('id','download-item-number');
    $(number).text('0');
    $(tags).append(number).append(download);
    $(tags).click(function() {
      var download_list = Array();
      $('.download').each((i,el) => {
        download_list.push({
          type:$(el).attr('type'),
          link:$(el).attr('download-link'),
          ext:$(el).attr('extension'),
          course:$(el).attr('course'),
          id:$(el).attr('id'),
          title:$(el).text()
        });
        setItemDownloading($(el));
      });
      var obj = Object();
      obj.target = globalOutputDirectory;
      obj.list = download_list;
      ipcRenderer.send('download-request',obj);
    });
    $(panel_header).append(title).append(tags).append(folder_container);
    $(panel).append(panel_header);
    arg.forEach((course,index) => {
      var course_container = document.createElement('div');
      $(course_container).addClass('panel-block');
      var checkbox_container = document.createElement('label');
      var checkbox = document.createElement('i');
      $(checkbox).addClass('fa fa-square-o');
      $(checkbox).click(toggleCheckboxesContainer);
      $(checkbox).css('visibility','hidden');
      $(checkbox_container).append(checkbox);
      var title = `${course.id} - ${course.title} (${course.term})`;
      title = document.createTextNode(title)
      $(checkbox_container).append(title);
      var icon = document.createElement('i');
      $(icon).addClass('fa fa-plus-circle');
      $(course_container).append(checkbox_container);
      $(course_container).append(icon);
      var material_container = document.createElement('div');
      $(material_container).addClass('panel-block sub-section material-container');
      $(material_container).attr('id',`material-${index}-container`);
      var progress = document.createElement('div');
      $(progress).addClass('progressbarcustom w-80');
      $(progress).addClass('progressbarcustom w-80');
      var bar = document.createElement('div');
      $(bar).addClass('indeterminate');
      $(progress).append(bar);
      $(material_container).append(progress);
      $(course_container).click(() => courseContainerOnClick($(course_container)));
      $(panel).append(course_container);
      $(panel).append(material_container);
    });
    $('#container').append(panel);
  });
  
  createSubsection = (parent,title,level,container,id,item) => {
    $(parent).prev().find('i').first().css('visibility','visible');
    var subsection = document.createElement('div');
    $(subsection).addClass('panel-block sub-section');
    var checkbox_container = document.createElement('label');
    $(checkbox_container).addClass(`level-${level}`);
    var checkbox = document.createElement('i');
    if($(parent).prev().find('i').first().hasClass('fa-check-square'))
      $(checkbox).addClass('fa fa-check-square');
    else
      $(checkbox).addClass('fa fa-square-o');
    if(!container) {
      $(subsection).addClass('downloadable-item');
      $(subsection).attr('type',item.type);
      $(subsection).attr('download-link',item.link);
      $(subsection).attr('extension',item.ext);
      $(subsection).attr('course',item.course);
      $(subsection).attr('id',item.id);
      $(subsection).click(subsectionItemOnClick);
    } else $(checkbox).click(toggleCheckboxesContainer);
    $(checkbox_container).append(checkbox);
    var name = document.createTextNode(title)
    $(checkbox_container).append(name);
    var icon = document.createElement('i');
    if(container) $(icon).addClass('fa fa-plus-circle');
    else $(icon).addClass('fa fa-download is-primary is-invisible');
    $(icon).css('float','right');
    $(icon).css('position','relative');
    $(icon).css('top','3px');
    $(subsection).append(checkbox_container);
    $(subsection).append(icon);
    if(container) {
      var subsection_container = document.createElement('div');
      $(subsection_container).addClass('sub-section material-container');
      $(subsection_container).attr('id',id);
      $(subsection).click(toggleSubsectionContainer);
    } else checkFileExists(title,item.type,item.course,item.ext,$(subsection));
    $(parent).append(subsection);
    if(container) $(parent).append(subsection_container);
  }
  
  updateDownloadCounter = () => {
    $('#download-item-number').text($('.download').length);
  }
  
  function toggleCheckboxesContainer() {
    event.stopPropagation();
    $(this).toggleClass('fa-square-o');
    $(this).toggleClass('fa-check-square');
    var container = $(this).parent().parent().next();
    if($(this).hasClass('fa-square-o')) {
      $(container).find('i.fa-check-square')
      .removeClass('fa-check-square')
      .addClass('fa-square-o');
    } else {
      $(container).find('i.fa-square-o')
      .removeClass('fa-square-o')
      .addClass('fa-check-square');
    }
    $(container).find('i.fa-check-square:not(.material-container)')
    .parent().parent('.downloadable-item:not(.downloaded,.downloading)')
    .addClass('download');
    $(container).find('i.fa-square-o:not(.material-container)')
    .parent().parent('.downloadable-item:not(.downloaded,.downloading)')
    .removeClass('download');
    updateDownloadCounter();
  }
  
  function toggleSubsectionContainer() {
    var container = $(this).next();
    if($(container).css('display') == 'none') {
      $(container).css('display','block');
      $(container).find('.material-container').prev().css('display','block');
      $(this).find('i').last().removeClass('fa-plus-circle').addClass('fa-minus-circle');
    } else {
      $(container).css('display','none');
      $(container).find('.material-container').prev().css('display','none');
      $(this).find('i').last().removeClass('fa-minus-circle').addClass('fa-plus-circle');
    }
  }
  
  checkFileExists = (title,type,course,extension,element) => {
    var type = type == 'doc' ? 'documents' : 'videos';
    if(type=='videos') title = title.replace(/[\s/]/g,'');
    var d = require('path').join(globalOutputDirectory,course,type);
    var f = require('path').join(d,`${title}.${extension}`);
    require('fs').access(f,(error) => {
      if(error) { clearItemDownloaded(element); return; }
      setItemDownloaded(element);
    });
  }
  
  createSpinner = () => {
    var wrapper = document.createElement('div');
    $(wrapper).addClass('preloader-wrapper tiny active');
    var layer = document.createElement('div');
    $(layer).addClass('spinner-layer spinner-white');
    var left = document.createElement('div');
    $(left).addClass('circle-clipper left');
    var gap = document.createElement('div');
    $(gap).addClass('gap-patch');
    var right = document.createElement('div');
    $(right).addClass('circle-clipper right');
    var circle = document.createElement('div');
    $(circle).addClass('circle');
    $(left).append(circle);
    $(gap).append(circle);
    $(right).append(circle);
    $(layer).append(left).append(gap).append(right);
    $(wrapper).append(layer);
    return $(wrapper);
  }
  
  setItemDownloaded = (item) => {
    $(item).removeClass('download downloading downloadable-item');
    $(item).addClass('downloaded');
    $(item).find('div').css('display','none');
    $(item).find('i').first().addClass('is-invisible');
    $(item).find('i').last().removeClass('is-invisible');
    updateDownloadCounter();
  }
  
  setItemDownloading = (item) => {
    $(item).removeClass('download downloadable-item download-failed');
    $(item).addClass('downloading');
    $(item).find('i').first().addClass('is-invisible');
    $(item).append(createSpinner());
    updateDownloadCounter();
  }
  
  clearItemDownloaded = (item) => {
    if($(item).hasClass('downloading')) $(item).removeClass('download');
    if($(item).hasClass('downloaded')) $(item).removeClass('download');
    $(item).removeClass('downloading downloaded');
    $(item).addClass('downloadable-item');
    $(item).find('i').first().removeClass('is-invisible');
    if($(item).hasClass('download'))
      $(item).find('i').first().removeClass('fa-square-o').addClass('fa-check-square');
    else
      $(item).find('i').first().removeClass('fa-check-square').addClass('fa-square-o');
    $(item).find('i').last().addClass('is-invisible');
    updateDownloadCounter();
  }
  
  courseContainerOnClick = (sibling) => {
    var container = $(sibling).next();
    if($(container).css('display') == 'none') {
      $(container).css('display','block');
      $(container).find('.material-container').prev().css('display','block');
      $(sibling).find('i').last().removeClass('fa-plus-circle').addClass('fa-minus-circle');
    } else {
      $(container).css('display','none');
      $(container).find('.material-container').prev().css('display','none');
      $(sibling).find('i').last().removeClass('fa-minus-circle').addClass('fa-plus-circle');
    }
  }
  
  function subsectionItemOnClick() {
    var icon = $(this).find('i').first();
    if(icon.hasClass('fa-square-o')) {
      $(this).not('.downloading, .downloaded').addClass('download');
      icon.removeClass('fa-square-o').addClass('fa-check-square');
    } else {
      $(this).removeClass('download');
      icon.removeClass('fa-check-square').addClass('fa-square-o');
    }
    updateDownloadCounter();
  }
  
  checkFiles = () => {
    $('.downloaded, .downloadable-item').each((i,el) => {
      var title = $(el).text();
      var course = $(el).attr('course');
      var type = $(el).attr('type');
      var ext = $(el).attr('extension');
      checkFileExists(title,type,course,ext,el);
    });
  }
  
  
  outputDirectoryOnClick = () => {
    const dialog = require('electron').remote.dialog;
    dialog.showOpenDialog({
      properties: ['openDirectory','createDirectory']
    }, (paths) => {
      globalOutputDirectory = paths.toString();
      $('#download-item-number').text('0');
      checkFiles();
      setUpFilewatcher();
    });
  }
  
  setItemFailed = (item) => {
    $(item).removeClass('download downloading downloaded');
    $(item).addClass('downloadable-item download-failed');
    $(item).find('div').css('display','none');
    $(item).find('i').first().removeClass('is-invisible');
    $(item).find('i').last().addClass('is-invisible');
    updateDownloadCounter();
  }
  
  ipcRenderer.on('download-finished', (event, arg) => {
    if(arg.result == 'success')
      setItemDownloaded($(`#${arg.id}`));
    else
      setItemFailed($(`#${arg.id}`));
  });
  
  ipcRenderer.on('content-list', (event, arg) => {
    var parent = $(`#material-${arg.index}-container`);
    $(parent).html('');
    $(parent).removeClass('panel-block');
    if(arg.content.document.length) {
      var id = `documents-${arg.index}-container`;
      createSubsection(parent,'Documents',1,true,id);
      arg.content.document.forEach((item,index) => {
        var i = {
          type:'doc',
          link:item.download_link,
          ext:item.extension,
          course:globalCourseArchive[arg.index].id,
          id:`course-${arg.index}-document-item-${index}`
        };
        createSubsection($(`#${id}`),item.title,2,null,null,i);
      });
    }
    if(arg.content.video.length) {
      var id = `videos-${arg.index}-container`;
      createSubsection(parent,'Videos',1,true,id);
      arg.content.video.forEach((item,index) => {
        var i = {
          type:'vid',
          link:item.download_link,
          ext:'ts',
          course:globalCourseArchive[arg.index].id,
          id:`course-${arg.index}-video-item-${index}`
        };
        createSubsection($(`#${id}`),item.title,2,null,null,i);
      });
    }
    if(arg.content.error) {
      var no_material = document.createElement('div');
      $(no_material).addClass('panel-block sub-section bg-danger-l fg-danger-l');
      var msg = document.createElement('span');
      $(msg).addClass('level-1');
      $(msg).text(arg.content.error.message);
      no_material.append(msg);
      var no_material_helper = document.createElement('div');
      $(no_material_helper).addClass('.material-container');
      $(parent).append(no_material);
      $(parent).append(no_material_helper);
    } else if(!arg.content.document.length && !arg.content.video.length) {
      var no_material = document.createElement('div');
      $(no_material).addClass('panel-block sub-section bg-info-l fg-info-l');
      var msg = document.createElement('span');
      $(msg).addClass('level-1');
      $(msg).text('No content for this course.');
      no_material.append(msg);
      var no_material_helper = document.createElement('div');
      $(no_material_helper).addClass('.material-container');
      $(parent).append(no_material);
      $(parent).append(no_material_helper);
    } else {}
  });
}
window.$ = window.jQuery = require('jquery');
const ipcRenderer = require('electron').ipcRenderer;
const crypto = require('crypto');
var globalDownloadContainer = Array();

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
    
  ipcRenderer.on('courses-list', (event, arg) => {
    $('#container').removeClass('justify-content-center');
    $('#container').addClass('justify-content-start');
    $('#container').html('');
    var panel = document.createElement('div');
    $(panel).addClass('panel w-80');
    var panel_header = document.createElement('div');
    $(panel_header).addClass('panel-heading');
    var title = document.createElement('span');
    $(title).text('Courses');
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
          title:$(el).text()
        });
      });
      var hashExisting = crypto.createHash('md5');
      hashExisting = hashExisting.update(JSON.stringify(globalDownloadContainer));
      hashExisting = hashExisting.digest('hex');
      var hashNew = crypto.createHash('md5');
      hashNew = hashNew.update(JSON.stringify(download_list));
      hashNew = hashNew.digest('hex');
      if(hashNew != hashExisting) {
        $('.download').each((i,el) => {
          $(el).removeClass('download').addClass('downloading');
          $(el).removeClass('downloadable-item');
          $(el).find('i').first().addClass('is-invisible');
          $(el).find('i').last().removeClass('is-invisible');
          $(el).unbind('click');
          $('#download-item-number').text('0');
        });
        globalDownloadContainer = download_list;
        ipcRenderer.send('download-request',download_list);
      }
    });
    $(panel_header).append(title).append(tags);
    $(panel).append(panel_header);
    arg.forEach((course,index) => {
      var course_container = document.createElement('div');
      $(course_container).addClass('panel-block');
      var checkbox_container = document.createElement('label');
      var checkbox = document.createElement('i');
      $(checkbox).addClass('fa fa-square-o');
      $(checkbox).click(function(event) {
        event.stopPropagation();
        if($(this).hasClass('fa-square-o')) {
          $(this).removeClass('fa-square-o').addClass('fa-check-square');
          var container = $(this).parent().parent().next();
          $(container).find('.sub-section').each((i,el) => {
            var icon = $(el).find('i').first();
            if(icon.hasClass('fa-square-o')) {
              $(icon).removeClass('fa-square-o').addClass('fa-check-square');
              
            }
          });
        }
        else {
          $(this).removeClass('fa-check-square').addClass('fa-square-o');
          var container = $(this).parent().parent().next();
          $(container).find('.sub-section').each((i,el) => {
            var icon = $(el).find('i').first();
            if(icon.hasClass('fa-check-square'))
              $(icon).removeClass('fa-check-square').addClass('fa-square-o');
          });
        }
        updateDownloadCounter();
      });
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
      $(course_container).click(function() {
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
        updateDownloadCounter();
      })
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
      $(subsection).click(function() {
        var icon = $(this).find('i').first();
        if($(icon).hasClass('fa-square-o'))
          $(icon).removeClass('fa-square-o').addClass('fa-check-square');
        else
          $(icon).removeClass('fa-check-square').addClass('fa-square-o');
        updateDownloadCounter();
      });
    } else {
      $(checkbox).click(function(event) {
        event.stopPropagation();
        if($(this).hasClass('fa-square-o')) {
          $(this).removeClass('fa-square-o').addClass('fa-check-square');
          var container = $(this).parent().parent().next();
          $(container).find('.sub-section').each((i,el) => {
            var icon = $(el).find('i').first();
            if(icon.hasClass('fa-square-o'))
              icon.removeClass('fa-square-o').addClass('fa-check-square');
          });
        }
        else {
          $(this).removeClass('fa-check-square').addClass('fa-square-o');
          var container = $(this).parent().parent().next();
          $(container).find('.sub-section').each((i,el) => {
            var icon = $(el).find('i').first();
            if(icon.hasClass('fa-check-square'))
              icon.removeClass('fa-check-square').addClass('fa-square-o');
          });
        }
        updateDownloadCounter();
      });
    }
    $(checkbox_container).append(checkbox);
    title = document.createTextNode(title)
    $(checkbox_container).append(title);
    var icon = document.createElement('i');
    if(container) $(icon).addClass('fa fa-plus-circle');
    else $(icon).addClass('fa fa-arrow-circle-down is-primary is-invisible');
    $(icon).css('float','right');
    $(icon).css('position','relative');
    $(icon).css('top','3px');
    $(subsection).append(checkbox_container);
    $(subsection).append(icon);
    if(container) {
      var subsection_container = document.createElement('div');
      $(subsection_container).addClass('sub-section material-container');
      $(subsection_container).attr('id',id);
      $(subsection).click(function() {
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
      });
    }
    $(parent).append(subsection);
    if(container) $(parent).append(subsection_container);
  }
  
  updateDownloadCounter = () => {
    $('.downloadable-item').removeClass('download bg-primary has-text-white');
    var elements = $('.downloadable-item').find('i.fa-check-square');
    $(elements).parent().parent().addClass('download bg-primary has-text-white');
    var number = elements.length;
    number = number || 0;
    $('#download-item-number').text(number);
  }
  
  ipcRenderer.on('content-list', (event, arg) => {
    var parent = $(`#material-${arg.index}-container`);
    $(parent).html('');
    $(parent).removeClass('panel-block');
    if(arg.content.document.length) {
      var id = `documents-${arg.index}-container`;
      createSubsection(parent,'Documents',1,true,id);
      arg.content.document.forEach((item) => {
        var i = {
          type:'doc',
          link:item.download_link,
          ext:item.extension
        };
        createSubsection($(`#${id}`),item.title,2,null,null,i);
      });
    }
    if(arg.content.video.length) {
      var id = `videos-${arg.index}-container`;
      createSubsection(parent,'Videos',1,true,id);
      arg.content.video.forEach((item) => {
        var i = {
          type:'vid',
          link:item.download_link,
          ext:'ts'
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
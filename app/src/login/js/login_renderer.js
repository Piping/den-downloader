window.$ = window.jQuery = require('jquery');
const ipcRenderer = require('electron').ipcRenderer;

window.onload = () => {
  $('#user').on('input', function() {
    if($(this).val() === '') {
      $(this).removeClass('is-danger');
      $(this).removeClass('is-primary');
      $('#user-i').removeClass('fa-warning');
      $('#user-i').removeClass('fa-check');
    } else if(/^[a-z0-9]+@usc.edu$/g.test($(this).val())) {
      $(this).addClass('is-primary');
      $(this).removeClass('is-danger');
      $('#user-i').addClass('fa-check');
      $('#user-i').removeClass('fa-warning');
    } else {
      $(this).addClass('is-danger');
      $('#user-i').addClass('fa-warning');
    }
  });
  
  $('#pass').on('input', function() {
    if($(this).val() === '') {
      $(this).removeClass('is-primary');
      $('#pass-i').removeClass('fa-check');
    } else {
      $(this).addClass('is-primary');
      $('#pass-i').addClass('fa-check');
    }
  });
  
  $('button').on('click', function() {
    if($('#user').hasClass('is-primary') && $('#pass').hasClass('is-primary')) {
      ipcRenderer.send('login-submit',{user:$('#user').val(),pass:$('#pass').val()});
      window.location.href = '../content/content.html';
    }
  });
}
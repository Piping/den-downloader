window.$ = window.jQuery = require('jquery');
const ipcRenderer = require('electron').ipcRenderer;

window.onload = () => {
  $('#user').on('input', function() {
    if($(this).val() === '') {
      $(this).removeClass('is-danger is-primary');
      $('#user-i').removeClass('fa-warning fa-check');
    } else if(/^[a-z0-9]+@usc.edu$/g.test($(this).val())) {
      $(this).addClass('is-primary').removeClass('is-danger');
      $('#user-i').addClass('fa-check').removeClass('fa-warning');
    } else {
      $(this).addClass('is-danger');
      $('#user-i').addClass('fa-warning');
    }
  });
  
  $('#pass').on('input', function() {
    if($(this).val() === '') {
      $(this).removeClass('is-primary is-danger');
      $('#pass-i').removeClass('fa-check fa-warning');
    } else if($(this).val().length > 8 && $(this).val().length < 50){
      $(this).addClass('is-primary').removeClass('is-danger');
      $('#pass-i').addClass('fa-check').removeClass('fa-warning');
    } else {
      $(this).addClass('is-danger').removeClass('is-primary');
      $('#pass-i').addClass('fa-warning').removeClass('fa-check');
    }
  });
  
  $('button').on('click', function() {
    if($('#user').hasClass('is-primary') && $('#pass').hasClass('is-primary')) {
      ipcRenderer.send('login-submit',{user:$('#user').val(),pass:$('#pass').val()});
      window.location.href = '../content/content.html';
    }
  });
}
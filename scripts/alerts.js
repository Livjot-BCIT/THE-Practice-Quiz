const defaultSwal = {
  customClass: {
    popup: 'quiz-swal',
    title: 'quiz-swal-title',
    confirmButton: 'quiz-swal-confirm',
    cancelButton: 'quiz-swal-cancel',
    icon: 'quiz-swal-icon'
  },
  buttonsStyling: false, // let CSS style the buttons
  background: getCSS('--color-bg-alt'),
  color: getCSS('--color-text')
};

function getCSS(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function niceAlert(message, type='info', title='') {
  return Swal.fire({
    ...defaultSwal,
    title: title || (type==='error'?'Uh oh': type==='warning'?'Hey, Listen!':'Hey, Listen!'),
    text: message,
    icon: type,
    iconColor: getCSS('--color-accent-focus'),
    confirmButtonText: 'OK'
  });
}

function niceConfirm({
  title='Are you sure?', text='', confirmText='Yes', cancelText='Cancel', icon='warning'
} = {}) {
  return Swal.fire({
    ...defaultSwal,
    title, text, icon,
    iconColor: getCSS('--color-accent-focus'),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  }).then(r => r.isConfirmed);
}

const toast = Swal.mixin({
  ...defaultSwal,
  toast: true, position: 'top-end', showConfirmButton: false,
  timer: 2200, timerProgressBar: true
});
function niceToast(message, icon='success'){
  return toast.fire({ title: message, icon, iconColor: getCSS('--color-accent-focus') });
}

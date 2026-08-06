$(document).ready(function() {
    console.log('✅ Register script loaded');

    // password validation
    $('#confirmPassword').on('keyup', function() {
        const password = $('#password').val();
        const confirm = $(this).val();
        
        if (password !== confirm) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // auto-dismiss alerts
    setTimeout(function() {
        $('.alert').fadeOut('slow');
    }, 5000);
});
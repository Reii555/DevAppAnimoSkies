$(document).ready(function() {
    
    // ============================================================
    // TOAST NOTIFICATION FUNCTION
    // ============================================================
    function showToast(message, type) {
        var toast = $('#toastMsg');
        var toastText = $('#toastText');
        var toastIcon = toast.find('i');
        
        toast.removeClass('success error warning info show');
        
        if (type === 'success') {
            toast.addClass('success');
            toastIcon.removeClass().addClass('fas fa-check-circle');
        } else if (type === 'error') {
            toast.addClass('error');
            toastIcon.removeClass().addClass('fas fa-exclamation-circle');
        } else if (type === 'warning') {
            toast.addClass('warning');
            toastIcon.removeClass().addClass('fas fa-exclamation-triangle');
        } else {
            toast.addClass('info');
            toastIcon.removeClass().addClass('fas fa-info-circle');
        }
        
        toastText.text(message);
        toast.addClass('show');
        
        if (toast.data('timeout')) {
            clearTimeout(toast.data('timeout'));
        }
        
        var timeout = setTimeout(function() {
            toast.removeClass('show');
        }, 4000);
        toast.data('timeout', timeout);
    }
    
    $('#toastMsg').on('click', function() {
        $(this).removeClass('show');
        if ($(this).data('timeout')) {
            clearTimeout($(this).data('timeout'));
        }
    });

    // ============================================================
    // AVATAR UPLOAD
    // ============================================================
    $('#uploadBtn').on('click', function(e) {
        e.preventDefault();
        $('#avatarUpload').click();
    });

    $('#avatarUpload').on('change', function(e) {
        e.preventDefault();
        var file = e.target.files[0];
        if (!file) {
            return;
        }

        var validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (validTypes.indexOf(file.type) === -1) {
            showToast('Please select a valid image (PNG/JPG)', 'error');
            $(this).val('');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('File size must be less than 2MB', 'error');
            $(this).val('');
            return;
        }

        var uploadBtn = $('#uploadBtn');
        uploadBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Uploading...');

        var reader = new FileReader();
        reader.onload = function(event) {
            var imageData = event.target.result;
            
            $('#avatarPreview').html('<img src="' + imageData + '" alt="Profile Picture">');
            
            $.ajax({
                url: '/profile/picture',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ profilePicture: imageData }),
                success: function(response) {
                    if (response.success) {
                        showToast('Profile picture updated successfully!', 'success');
                    } else {
                        showToast(response.message || 'Error updating profile picture', 'error');
                    }
                    uploadBtn.prop('disabled', false).html('<i class="fas fa-camera me-1"></i> Upload photo');
                },
                error: function(xhr) {
                    var response = xhr.responseJSON;
                    var errorMsg = response ? response.message : 'Error uploading profile picture';
                    showToast(errorMsg, 'error');
                    uploadBtn.prop('disabled', false).html('<i class="fas fa-camera me-1"></i> Upload photo');
                }
            });
        };
        reader.readAsDataURL(file);
    });

    // ============================================================
    // EDIT PROFILE 
    // ============================================================
    $('#editProfileForm').on('submit', function(e) {
        e.preventDefault();

        var full_name = $('#full_name').val().trim();
        var contact_num = $('#contact_num').val().trim();
        var passport_num = $('#passport_num').val().trim().toUpperCase();
        var nationality = $('#nationality').val();
        var birth_date = $('#birth_date').val();
        var gender = $('#gender').val();
        var type = $('#type').val();
        var emergency_contact = $('#emergency_contact').val().trim();

        if (!full_name || !contact_num || !passport_num || !nationality || !birth_date || !gender) {
            showToast('All required fields must be filled', 'error');
            return;
        }

        var phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(contact_num)) {
            showToast('Please enter a valid phone number (e.g., +63 912 345 6789)', 'error');
            return;
        }

        if (!/^[A-Z0-9]{6,10}$/.test(passport_num)) {
            showToast('Passport number must be 6-10 alphanumeric characters', 'error');
            return;
        }

        var submitBtn = $(this).find('button[type="submit"]');
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Saving...');

        $.ajax({
            url: '/profile/update', // Ensure this matches your routes file
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                full_name: full_name,
                contact_num: contact_num,
                passport_num: passport_num,
                nationality: nationality,
                birth_date: birth_date,
                gender: gender,
                type: type,
                emergency_contact: emergency_contact
            }),
            success: function(response) {
                if (response.success) {
                    showToast('Profile updated successfully!', 'success');
                    setTimeout(function() {
                        window.location.href = '/profile';
                    }, 1500);
                } else {
                    showToast(response.message || 'Error updating profile', 'error');
                    submitBtn.prop('disabled', false).html('<i class="fas fa-save me-1"></i> Save Changes');
                }
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                var errorMsg = response ? response.message : 'Error updating profile';
                showToast(errorMsg, 'error');
                submitBtn.prop('disabled', false).html('<i class="fas fa-save me-1"></i> Save Changes');
            }
        });
    });

    // ============================================================
    // CANCEL BUTTON
    // ============================================================
    $('#cancelBtn').on('click', function(e) {
        e.preventDefault();
        window.location.href = '/profile';
    });

    // ============================================================
    // VALIDATION FOR PHONE NUMBER
    // ============================================================
    $('#contact_num').on('blur', function() {
        var phone = $(this).val().trim();
        var phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (phone && !phoneRegex.test(phone)) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    $('#passport_num').on('blur', function() {
        var passport = $(this).val().trim().toUpperCase();
        if (passport && !/^[A-Z0-9]{6,10}$/.test(passport)) {
            $(this).addClass('is-invalid');
        } else {
            $(this).removeClass('is-invalid');
        }
    });

    // ============================================================
    // ADD SAVED PASSENGERS
    // ============================================================
    $('#addPassengerBtn').on('click', function() {
        var firstName = $('#passengerFirstName').val().trim();
        var lastName = $('#passengerLastName').val().trim();
        var passportNumber = $('#passengerPassport').val().trim().toUpperCase();
        var dateOfBirth = $('#passengerDob').val();
        var nationality = $('#passengerNationality').val().trim();
        var gender = $('#passengerGender').val();
        var type = $('#passengerType').val();

        if (!firstName || !lastName || !passportNumber || !dateOfBirth || !nationality || !gender) {
            showToast('All passenger fields are required', 'error');
            return;
        }

        if (!/^[A-Z0-9]{6,10}$/.test(passportNumber)) {
            showToast('Passport number must be 6-10 alphanumeric characters', 'error');
            return;
        }

        var submitBtn = $(this);
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Adding...');

        // FIX: Send full_name instead of firstName/lastName and passport_num instead of passportNumber
        $.ajax({
            url: '/profile/passengers',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                full_name: firstName + " " + lastName,
                passport_num: passportNumber,
                birth_date: dateOfBirth,
                nationality: nationality,
                gender: gender,
                type: type,
                contact_num: "N/A",
                emergency_contact: "N/A"
            }),
            success: function(response) {
                if (response.success) {
                    showToast('Passenger saved successfully!', 'success');
                    $('#passengerFirstName').val('');
                    $('#passengerLastName').val('');
                    $('#passengerPassport').val('');
                    $('#passengerDob').val('');
                    $('#passengerNationality').val('');
                    $('#passengerGender').val('');
                    $('#passengerType').val('Adult');
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast(response.message || 'Error saving passenger', 'error');
                    submitBtn.prop('disabled', false).html('<i class="fas fa-plus me-1"></i> Add Passenger');
                }
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                var errorMsg = response ? response.message : 'Error saving passenger';
                showToast(errorMsg, 'error');
                submitBtn.prop('disabled', false).html('<i class="fas fa-plus me-1"></i> Add Passenger');
            }
        });
    });

    // ============================================================
    // REMOVE SAVED PASSENGERS (FIX: Use Passport/ID)
    // ============================================================
    $(document).on('click', '.remove-passenger', function() {
        var passengerId = $(this).data('id'); // We need to change the HBS to use 'data-id' instead of 'data-index'

        if (!passengerId) {
            // Fallback attempt to get ID if using the wrong HTML format
            passengerId = $(this).data('passport'); 
        }

        if (!passengerId) {
            showToast('Error: Could not identify passenger to remove.', 'error');
            return;
        }

        if (confirm('Are you sure you want to remove this passenger?')) {
            $.ajax({
                url: '/profile/passengers/' + passengerId, // Sending ID to backend
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showToast('Passenger removed successfully!', 'success');
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showToast(response.message || 'Error removing passenger', 'error');
                    }
                },
                error: function() {
                    showToast('Error removing passenger', 'error');
                }
            });
        }
    });

    // ============================================================
    // ADD PAYMENT METHODS (FIX: Correct URL)
    // ============================================================
    $('#addPaymentBtn').on('click', function() {
        var cardType = $('#paymentCardType').val();
        var cardNumber = $('#paymentCardNumber').val().trim();
        var cardholderName = $('#paymentCardholder').val().trim();
        var expiryMonth = $('#paymentExpiryMonth').val().trim();
        var expiryYear = $('#paymentExpiryYear').val().trim();
        var isDefault = $('#paymentDefault').is(':checked');

        if (!cardType || !cardNumber || !cardholderName || !expiryMonth || !expiryYear) {
            showToast('All payment fields are required', 'error');
            return;
        }

        if (!/^\d{4}$/.test(cardNumber)) {
            showToast('Please enter the last 4 digits of your card', 'error');
            return;
        }

        if (!/^\d{2}$/.test(expiryMonth) || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
            showToast('Please enter a valid expiry month (01-12)', 'error');
            return;
        }

        if (!/^\d{2}$/.test(expiryYear)) {
            showToast('Please enter a valid expiry year (YY)', 'error');
            return;
        }

        var submitBtn = $(this);
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Adding...');

        // FIX: Correct URL is /profile/payment-methods
        $.ajax({
            url: '/profile/payment-methods', 
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                cardType: cardType,
                cardNumber: '**** **** **** ' + cardNumber,
                cardholderName: cardholderName,
                expiryMonth: expiryMonth,
                expiryYear: expiryYear,
                isDefault: isDefault
            }),
            success: function(response) {
                if (response.success) {
                    showToast('Payment method added successfully!', 'success');
                    $('#paymentCardType').val('');
                    $('#paymentCardNumber').val('');
                    $('#paymentCardholder').val('');
                    $('#paymentExpiryMonth').val('');
                    $('#paymentExpiryYear').val('');
                    $('#paymentDefault').prop('checked', false);
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast(response.message || 'Error adding payment method', 'error');
                    submitBtn.prop('disabled', false).html('<i class="fas fa-plus me-1"></i> Add Payment');
                }
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                var errorMsg = response ? response.message : 'Error adding payment method';
                showToast(errorMsg, 'error');
                submitBtn.prop('disabled', false).html('<i class="fas fa-plus me-1"></i> Add Payment');
            }
        });
    });

    // ============================================================
    // REMOVE PAYMENT METHODS (FIX: Correct URL)
    // ============================================================
    $(document).on('click', '.remove-payment', function() {
        var index = $(this).data('index');
        if (confirm('Are you sure you want to remove this payment method?')) {
            // FIX: Correct URL is /profile/payment-methods/ + index
            $.ajax({
                url: '/profile/payment-methods/' + index,
                method: 'DELETE',
                success: function(response) {
                    if (response.success) {
                        showToast('Payment method removed successfully!', 'success');
                        setTimeout(function() {
                            window.location.reload();
                        }, 1500);
                    } else {
                        showToast(response.message || 'Error removing payment method', 'error');
                    }
                },
                error: function() {
                    showToast('Error removing payment method', 'error');
                }
            });
        }
    });

    // ============================================================
    // SET DEFAULT PAYMENT (FIX: Correct URL)
    // ============================================================
    $(document).on('click', '.set-default-payment', function() {
        var index = $(this).data('index');
        // FIX: Correct URL is /profile/payment-methods/ + index + /default
        $.ajax({
            url: '/profile/payment-methods/' + index + '/default',
            method: 'PUT',
            success: function(response) {
                if (response.success) {
                    showToast('Default payment method updated!', 'success');
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast(response.message || 'Error updating default payment', 'error');
                }
            },
            error: function() {
                showToast('Error updating default payment', 'error');
            }
        });
    });

    // ============================================================
    // NOTIFICATION PREFERENCES
    // ============================================================
    $('.notif-toggle').on('change', function() {
        var key = $(this).data('key');
        var value = $(this).is(':checked');
        var data = {};
        data[key] = value;

        $.ajax({
            url: '/profile/notifications',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showToast('Notification preference updated!', 'success');
                } else {
                    showToast(response.message || 'Error updating preference', 'error');
                }
            },
            error: function() {
                showToast('Error updating preference', 'error');
            }
        });
    });
});
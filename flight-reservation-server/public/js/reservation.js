$(document).ready(function() {
    
    // ============================================================
    // TOAST NOTIFICATION 
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
    // MEAL PRICES
    // ============================================================
    var mealPrices = {
        'Standard': 0,
        'Vegetarian': 150,
        'Vegan': 200,
        'Halal': 250,
        'Kosher': 300,
        'Gluten-Free': 200
    };

    // Extra Services Prices
    var extraServicePrices = {
        'Premium Seat': 500,
        'Checked-in Baggage': 600,
        'Carry-on Baggage': 300,
        'Priority Boarding': 500,
        'Travel Insurance': 700,
        'Lounge Access': 1000
    };

    function updateMealPrice() {
        var selectedMeal = $('#editMealPreference').val();
        var price = mealPrices[selectedMeal] || 0;
        if (price > 0) {
            $('#mealPriceDisplay').text('(+₱' + price + '.00)');
        } else {
            $('#mealPriceDisplay').text('(Included)');
        }
    }

    // Calculate total price with extras
    function calculateTotalPrice() {
        var basePrice = currentTotalPrice - currentExtraServicesTotal;
        var mealPrice = mealPrices[$('#editMealPreference').val()] || 0;
        var extrasTotal = 0;
        
        // Calculate extra services total
        $('.extra-service-toggle:checked').each(function() {
            var price = parseFloat($(this).data('price')) || 0;
            extrasTotal += price;
        });
        
        var newTotal = basePrice + mealPrice + extrasTotal;
        $('#editTotalPrice').text('₱' + newTotal.toFixed(2));
        return newTotal;
    }

    // ============================================================
    // Update price for Extra Service
    // ============================================================
    $(document).on('change', '.extra-service-toggle', function() {
        calculateTotalPrice();
    });

    // ============================================================
    // EXPAND RESERVATION DETAILS
    // ============================================================
    $(document).on('click', '.res-expand-icon', function(e) {
        e.stopPropagation();
        var item = $(this).closest('.reservation-item');
        item.find('.res-detail').slideToggle();
        $(this).toggleClass('fa-chevron-down fa-chevron-up');
    });

    $(document).on('click', '.res-summary', function() {
        var icon = $(this).find('.res-expand-icon');
        var item = $(this).closest('.reservation-item');
        item.find('.res-detail').slideToggle();
        icon.toggleClass('fa-chevron-down fa-chevron-up');
    });

    // ============================================================
    // VIEW DETAILS MODAL
    // ============================================================
    $(document).on('click', '.view-details', function(e) {
        e.preventDefault();
        var reservationId = $(this).data('id');
        
        $('#detailsContent').html('<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading details...</p></div>');
        
        $.ajax({
            url: '/reservations/details/' + reservationId,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var data = response.data;
                    var html = '';
                    
                    var bookingDate = new Date(data.booking_date);
                    var formattedDate = bookingDate.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    var departureDate = new Date(data.flight.departureTime);
                    var formattedDeparture = departureDate.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    var statusClass = '';
                    if (data.status === 'Confirmed') {
                        statusClass = 'success';
                    } else if (data.status === 'Pending') {
                        statusClass = 'warning';
                    } else if (data.status === 'Cancelled') {
                        statusClass = 'danger';
                    } else {
                        statusClass = 'secondary';
                    }
                    
                    var mealPrice = mealPrices[data.mealPreference] || 0;
                    
                    html += '<div class="row">';
                    html += '  <div class="col-md-6">';
                    html += '    <p><strong>Booking Reference:</strong> ' + data.booking_ref + '</p>';
                    html += '    <p><strong>Passenger:</strong> ' + data.passengerName + '</p>';
                    html += '    <p><strong>Flight:</strong> ' + data.flight.flight_number + ' (' + data.flight.airline + ')</p>';
                    html += '    <p><strong>Route:</strong> ' + data.flight.origin + ' → ' + data.flight.destination + '</p>';
                    html += '    <p><strong>Departure:</strong> ' + formattedDeparture + '</p>';
                    html += '  </div>';
                    html += '  <div class="col-md-6">';
                    html += '    <p><strong>Seat:</strong> ' + data.seatNumber + '</p>';
                    html += '    <p><strong>Meal:</strong> ' + data.mealPreference + ' ' + (mealPrice > 0 ? '(+₱' + mealPrice + '.00)' : '') + '</p>';
                    html += '    <p><strong>Status:</strong> <span class="badge bg-' + statusClass + '">' + data.status + '</span></p>';
                    html += '    <p><strong>Total Price:</strong> ₱' + data.total_price + '.00</p>';
                    html += '    <p><strong>Booked On:</strong> ' + formattedDate + '</p>';
                    html += '  </div>';
                    html += '</div>';
                    
                    if (data.specialRequests) {
                        html += '<hr>';
                        html += '<p><strong>Special Requests:</strong> ' + data.specialRequests + '</p>';
                    }
                    
                    if (data.passengerDetails) {
                        html += '<hr>';
                        html += '<h6>Passenger Details</h6>';
                        html += '<div class="row">';
                        html += '  <div class="col-md-6">';
                        html += '    <p><strong>Full Name:</strong> ' + data.passengerDetails.fullName + '</p>';
                        html += '    <p><strong>Email:</strong> ' + data.passengerDetails.email + '</p>';
                        html += '    <p><strong>Contact:</strong> ' + data.passengerDetails.contactNumber + '</p>';
                        html += '  </div>';
                        html += '  <div class="col-md-6">';
                        html += '    <p><strong>Passport:</strong> ' + data.passengerDetails.passportNumber + '</p>';
                        html += '    <p><strong>Nationality:</strong> ' + data.passengerDetails.nationality + '</p>';
                        html += '    <p><strong>Gender:</strong> ' + data.passengerDetails.gender + '</p>';
                        html += '  </div>';
                        html += '</div>';
                    }
                    
                    $('#detailsContent').html(html);
                    $('#detailsModal').modal('show');
                } else {
                    showToast(response.message || 'Error loading reservation details', 'error');
                }
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                var errorMsg = response ? response.message : 'Error loading reservation details';
                showToast(errorMsg, 'error');
                $('#detailsContent').html('<p class="text-danger text-center">Error loading details. Please try again.</p>');
            }
        });
    });

    // ============================================================
    // EDIT SEAT MODAL
    // ============================================================
    var currentReservationId = null;
    var selectedSeat = null;
    var currentSeatNumber = null;
    var currentFlightId = null;
    var currentMeal = null;
    var currentTotalPrice = null;
    var currentExtraServicesTotal = 0;
    var currentExtraServices = {};
    
    $(document).on('click', '.edit-seat', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var reservationId = $(this).data('id');
        var seat = $(this).data('seat');
        var meal = $(this).data('meal');
        var price = $(this).data('price');
        
        if (!reservationId) {
            showToast('Invalid reservation ID', 'error');
            return;
        }
        
        currentReservationId = reservationId;
        currentSeatNumber = seat || 'None';
        currentMeal = meal || 'Standard';
        selectedSeat = seat || null;
        currentTotalPrice = parseFloat(price) || 0;
        currentExtraServicesTotal = 0;
        currentExtraServices = {};
        currentFlightId = null;
        
        $('#editReservationId').val(reservationId);
        $('#editSelectedSeat').text(currentSeatNumber);
        $('#editMealPreference').val(currentMeal);
        $('#editSpecialRequests').val('');
        $('#editCurrentPrice').text('₱' + currentTotalPrice.toFixed(2));
        $('#editTotalPrice').text('₱' + currentTotalPrice.toFixed(2));
        updateMealPrice();
        
        // Reset extra service toggles
        $('.extra-service-toggle').prop('checked', false);
        
        $('#editSeatGrid').html('<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading seats...</p></div>');
        $('#editFlightInfo').html('<div class="text-center py-2"><i class="fas fa-spinner fa-spin"></i> Loading flight info...</div>');
        
        $.ajax({
            url: '/reservations/details/' + reservationId,
            method: 'GET',
            success: function(detailResponse) {
                if (detailResponse.success) {
                    var data = detailResponse.data;
                    var flightData = data.flight;
                    currentFlightId = flightData._id || flightData.id;
                    
                    var departureDate = new Date(flightData.departureTime);
                    var formattedDeparture = departureDate.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    $('#editFlightInfo').html(
                        '<p><strong>' + flightData.flight_number + '</strong> - ' + flightData.airline + '</p>' +
                        '<p>' + flightData.origin + ' → ' + flightData.destination + '</p>' +
                        '<p>Departure: ' + formattedDeparture + '</p>'
                    );
                    
                    if (currentFlightId) {
                        loadSeats(currentFlightId, reservationId);
                    } else {
                        $('#editSeatGrid').html('<p class="text-danger text-center">Could not find flight ID</p>');
                    }
                } else {
                    showToast(detailResponse.message || 'Error loading flight', 'error');
                    $('#editFlightInfo').html('<p class="text-danger text-center">Error loading flight info</p>');
                }
            },
            error: function() {
                showToast('Error loading flight information', 'error');
                $('#editFlightInfo').html('<p class="text-danger text-center">Error loading flight info</p>');
            }
        });
        
        $('#editSeatModal').modal('show');
    });
    
    // ============================================================
    // LOAD SEATS
    // ============================================================
    function loadSeats(flightId, reservationId) {
        $.ajax({
            url: '/reservations/seats/' + flightId + '/' + reservationId,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var data = response.data;
                    var seatsHtml = '';
                    var letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                    var totalRows = 10;
                    
                    seatsHtml += '<div class="table-responsive">';
                    seatsHtml += '<table class="table table-bordered text-center seat-table">';
                    seatsHtml += '<thead>';
                    seatsHtml += '<tr>';
                    seatsHtml += '<th style="width:40px;">#</th>';
                    seatsHtml += '<th>A</th>';
                    seatsHtml += '<th>B</th>';
                    seatsHtml += '<th>C</th>';
                    seatsHtml += '<th style="width:50px;background:#f1f5f9;color:#94a3b8;font-size:11px;font-weight:700;">AISLE</th>';
                    seatsHtml += '<th>D</th>';
                    seatsHtml += '<th>E</th>';
                    seatsHtml += '<th>F</th>';
                    seatsHtml += '</tr>';
                    seatsHtml += '</thead>';
                    seatsHtml += '<tbody>';
                    
                    for (var row = 1; row <= totalRows; row++) {
                        var isPremium = row <= 3;
                        seatsHtml += '<tr>';
                        seatsHtml += '<td style="font-weight:700;color:#64748b;font-size:12px;">' + row + '</td>';
                        
                        for (var col = 0; col < 3; col++) {
                            var seatNumber = row + letters[col];
                            var seatData = null;
                            
                            for (var i = 0; i < data.allSeats.length; i++) {
                                if (data.allSeats[i].seat === seatNumber) {
                                    seatData = data.allSeats[i];
                                    break;
                                }
                            }
                            
                            var seatClass = '';
                            var isDisabled = '';
                            var titleText = '';
                            
                            if (seatData) {
                                if (seatData.isBooked && !seatData.isCurrent) {
                                    seatClass = 'btn-secondary';
                                    isDisabled = 'disabled';
                                    titleText = 'title="This seat is already booked"';
                                } else if (seatData.isCurrent) {
                                    seatClass = 'btn-warning text-dark';
                                    titleText = 'title="Your current seat"';
                                    if (selectedSeat === null) {
                                        selectedSeat = seatNumber;
                                    }
                                } else if (selectedSeat === seatNumber) {
                                    seatClass = 'btn-primary';
                                } else if (isPremium) {
                                    seatClass = 'btn-outline-warning premium';
                                } else {
                                    seatClass = 'btn-outline-success';
                                }
                            } else {
                                if (isPremium) {
                                    seatClass = 'btn-outline-warning premium';
                                } else {
                                    seatClass = 'btn-outline-success';
                                }
                            }
                            
                            if (selectedSeat === seatNumber && seatData && !seatData.isBooked) {
                                seatClass = 'btn-primary';
                            }
                            
                            seatsHtml += '<td style="padding:4px;">';
                            seatsHtml += '<button class="btn btn-sm ' + seatClass + ' w-100 seat-btn" data-seat="' + seatNumber + '" ' + isDisabled + ' ' + titleText + ' style="font-size:11px;padding:4px 0;min-width:35px;">' + seatNumber + '</button>';
                            seatsHtml += '</td>';
                        }
                        
                        seatsHtml += '<td style="background:#f1f5f9;padding:2px;width:50px;"></td>';
                        
                        for (var col = 3; col < 6; col++) {
                            var seatNumber = row + letters[col];
                            var seatData = null;
                            
                            for (var i = 0; i < data.allSeats.length; i++) {
                                if (data.allSeats[i].seat === seatNumber) {
                                    seatData = data.allSeats[i];
                                    break;
                                }
                            }
                            
                            var seatClass = '';
                            var isDisabled = '';
                            var titleText = '';
                            
                            if (seatData) {
                                if (seatData.isBooked && !seatData.isCurrent) {
                                    seatClass = 'btn-secondary';
                                    isDisabled = 'disabled';
                                    titleText = 'title="This seat is already booked"';
                                } else if (seatData.isCurrent) {
                                    seatClass = 'btn-warning text-dark';
                                    titleText = 'title="Your current seat"';
                                    if (selectedSeat === null) {
                                        selectedSeat = seatNumber;
                                    }
                                } else if (selectedSeat === seatNumber) {
                                    seatClass = 'btn-primary';
                                } else if (isPremium) {
                                    seatClass = 'btn-outline-warning premium';
                                } else {
                                    seatClass = 'btn-outline-success';
                                }
                            } else {
                                if (isPremium) {
                                    seatClass = 'btn-outline-warning premium';
                                } else {
                                    seatClass = 'btn-outline-success';
                                }
                            }
                            
                            if (selectedSeat === seatNumber && seatData && !seatData.isBooked) {
                                seatClass = 'btn-primary';
                            }
                            
                            seatsHtml += '<td style="padding:4px;">';
                            seatsHtml += '<button class="btn btn-sm ' + seatClass + ' w-100 seat-btn" data-seat="' + seatNumber + '" ' + isDisabled + ' ' + titleText + ' style="font-size:11px;padding:4px 0;min-width:35px;">' + seatNumber + '</button>';
                            seatsHtml += '</td>';
                        }
                        
                        seatsHtml += '</tr>';
                    }
                    
                    seatsHtml += '</tbody>';
                    seatsHtml += '</table>';
                    seatsHtml += '</div>';
                    
                    seatsHtml += '<div class="d-flex gap-3 justify-content-center flex-wrap mt-3">';
                    seatsHtml += '  <span class="badge bg-success">Available</span>';
                    seatsHtml += '  <span class="badge bg-secondary">Booked</span>';
                    seatsHtml += '  <span class="badge bg-warning text-dark">Your Current</span>';
                    seatsHtml += '  <span class="badge bg-primary">Selected</span>';
                    seatsHtml += '  <span class="badge bg-warning text-dark" style="background:#ffc107 !important;">Premium</span>';
                    seatsHtml += '</div>';
                    
                    $('#editSeatGrid').html(seatsHtml);
                    
                    if (selectedSeat) {
                        $('#editSelectedSeat').text(selectedSeat);
                    }
                    
                    $('#availableSeatsCount').text(data.availableSeats + ' seats available');
                    
                    $(document).off('click', '.seat-btn:not(:disabled)');
                    $(document).on('click', '.seat-btn:not(:disabled)', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        var seat = $(this).data('seat');
                        var isPremium = parseInt(seat) <= 3;
                        
                        if ($(this).hasClass('btn-primary')) {
                            if (isPremium) {
                                $(this).removeClass('btn-primary').addClass('btn-outline-warning premium');
                            } else {
                                $(this).removeClass('btn-primary').addClass('btn-outline-success');
                            }
                            selectedSeat = null;
                            $('#editSelectedSeat').text('None');
                            return;
                        }
                        
                        $('.seat-btn').not(this).each(function() {
                            var s = $(this).data('seat');
                            var prem = parseInt(s) <= 3;
                            if ($(this).hasClass('btn-primary')) {
                                if (prem) {
                                    $(this).removeClass('btn-primary').addClass('btn-outline-warning premium');
                                } else {
                                    $(this).removeClass('btn-primary').addClass('btn-outline-success');
                                }
                            }
                        });
                        
                        $(this).removeClass('btn-outline-success btn-outline-warning premium').addClass('btn-primary');
                        
                        selectedSeat = seat;
                        $('#editSelectedSeat').text(seat);
                    });
                    
                } else {
                    showToast(response.message || 'Error loading seats', 'error');
                    $('#editSeatGrid').html('<p class="text-danger text-center">Error loading seats</p>');
                }
            },
            error: function() {
                showToast('Error loading seats', 'error');
                $('#editSeatGrid').html('<p class="text-danger text-center">Error loading seats</p>');
            }
        });
    }

    // ============================================================
    // MEAL PREFERENCE CHANGE
    // ============================================================
    $('#editMealPreference').on('change', function() {
        updateMealPrice();
        calculateTotalPrice();
    });

    // ============================================================
    // SAVE SEAT EDIT
    // ============================================================
    $('#saveSeatEdit').on('click', function(e) {
        e.preventDefault();
        
        var reservationId = $('#editReservationId').val();
        var mealPreference = $('#editMealPreference').val();
        var specialRequests = $('#editSpecialRequests').val().trim();
        
        // Get selected extra services
        var selectedExtras = [];
        var extrasTotal = 0;
        $('.extra-service-toggle:checked').each(function() {
            var name = $(this).data('name');
            var price = parseFloat($(this).data('price')) || 0;
            selectedExtras.push({ name: name, price: price });
            extrasTotal += price;
        });
        
        if (!selectedSeat) {
            showToast('Please select a seat', 'error');
            return;
        }
        
        var submitBtn = $(this);
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Saving...');
        
        $.ajax({
            url: '/reservations/' + reservationId + '/seat',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                seatNumber: selectedSeat,
                mealPreference: mealPreference,
                specialRequests: specialRequests,
                extraServices: selectedExtras,
                extraServicesPrice: extrasTotal
            }),
            success: function(response) {
                if (response.success) {
                    showToast('Reservation updated successfully!', 'success');
                    
                    var newPrice = response.data.total_price || 0;
                    $('#editTotalPrice').text('₱' + newPrice.toFixed(2));
                    
                    updateReservationItem(reservationId, selectedSeat, mealPreference, newPrice);
                    
                    setTimeout(function() {
                        $('#editSeatModal').modal('hide');
                        submitBtn.prop('disabled', false).html('<i class="fas fa-save me-1"></i> Save Changes');
                    }, 1000);
                } else {
                    showToast(response.message || 'Error updating reservation', 'error');
                    submitBtn.prop('disabled', false).html('<i class="fas fa-save me-1"></i> Save Changes');
                }
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                showToast(response?.message || 'Error updating reservation', 'error');
                submitBtn.prop('disabled', false).html('<i class="fas fa-save me-1"></i> Save Changes');
            }
        });
    });
    
    function updateReservationItem(reservationId, newSeat, newMeal, newPrice) {
        var item = $('.reservation-item[data-id="' + reservationId + '"]');
        if (item.length) {
            var routeText = item.find('.res-route').text();
            var updatedRoute = routeText.replace(/Seat \S+/, 'Seat ' + newSeat);
            item.find('.res-route').text(updatedRoute);
            
            var detailRows = item.find('.detail-row');
            if (detailRows.length >= 2) {
                var mealValue = detailRows.eq(1).find('.value').eq(0);
                if (mealValue.length) {
                    var mealPrice = mealPrices[newMeal] || 0;
                    mealValue.text(newMeal + (mealPrice > 0 ? ' (+₱' + mealPrice + '.00)' : ''));
                }
            }
            
            item.find('.res-price').html('₱' + newPrice + ' <i class="fas fa-chevron-down res-expand-icon"></i>');
            
            var editBtn = item.find('.edit-seat');
            editBtn.data('seat', newSeat);
            editBtn.data('meal', newMeal);
            editBtn.data('price', newPrice);
            
            item.css('border', '2px solid #22c55e');
            setTimeout(function() {
                item.css('border', '');
            }, 2000);
        }
    }

    // ============================================================
    // CANCEL RESERVATION
    // ============================================================
    var cancelReservationId = null;
    
    $(document).on('click', '.cancel-reservation', function(e) {
        e.preventDefault();
        cancelReservationId = $(this).data('id');
        var bookingRef = $(this).data('ref');
        var passengerName = $(this).data('passenger');
        
        $('#modalBookingRef').text(bookingRef || 'N/A');
        $('#modalBookingPassenger').text(passengerName || 'N/A');
        $('#cancelModal').modal('show');
    });
    
    $('#modalConfirmCancel').on('click', function(e) {
        e.preventDefault();
        
        if (!cancelReservationId) {
            showToast('No reservation selected', 'error');
            return;
        }
        
        var submitBtn = $(this);
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Cancelling...');
        
        $.ajax({
            url: '/reservations/' + cancelReservationId + '/cancel',
            method: 'PATCH',
            success: function(response) {
                if (response.success) {
                    showToast('Reservation cancelled successfully!', 'success');
                    
                    var item = $('.reservation-item[data-id="' + cancelReservationId + '"]');
                    if (item.length) {
                        var statusSpan = item.find('.res-status');
                        statusSpan.text('Cancelled');
                        statusSpan.removeClass('status-Pending status-Confirmed');
                        statusSpan.addClass('status-Cancelled');
                        item.find('.detail-actions .btn-edit, .detail-actions .btn-cancel').hide();
                    }
                    
                    $('#cancelModal').modal('hide');
                } else {
                    showToast(response.message || 'Error cancelling reservation', 'error');
                }
                submitBtn.prop('disabled', false).html('Yes, Cancel');
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                showToast(response?.message || 'Error cancelling reservation', 'error');
                submitBtn.prop('disabled', false).html('Yes, Cancel');
            }
        });
    });

    // ============================================================
    // SEARCH, FILTER, SORT, PAGINATION
    // ============================================================
    $('#searchInput').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();
        $('.reservation-item').each(function() {
            var text = $(this).text().toLowerCase();
            $(this).toggle(text.indexOf(searchTerm) > -1);
        });
    });
    
    $('#filterStatus').on('change', function() {
        var status = $(this).val();
        $('.reservation-item').each(function() {
            var itemStatus = $(this).find('.res-status').text().trim();
            $(this).toggle(status === 'all' || itemStatus === status);
        });
    });

    $('#sortSelect').on('change', function() {
        var sortValue = $(this).val();
        if (!sortValue) return;
        
        var container = $('#reservationsList');
        var items = container.find('.reservation-item').get();
        
        items.sort(function(a, b) {
            var aVal, bVal;
            switch(sortValue) {
                case 'priceAsc':
                    aVal = parseFloat($(a).find('.res-price').text().replace('₱', '').trim());
                    bVal = parseFloat($(b).find('.res-price').text().replace('₱', '').trim());
                    return aVal - bVal;
                case 'priceDesc':
                    aVal = parseFloat($(a).find('.res-price').text().replace('₱', '').trim());
                    bVal = parseFloat($(b).find('.res-price').text().replace('₱', '').trim());
                    return bVal - aVal;
                case 'status':
                    aVal = $(a).find('.res-status').text().trim();
                    bVal = $(b).find('.res-status').text().trim();
                    return aVal.localeCompare(bVal);
                case 'dateAsc':
                    aVal = new Date($(a).data('date'));
                    bVal = new Date($(b).data('date'));
                    return aVal - bVal;
                case 'dateDesc':
                    aVal = new Date($(a).data('date'));
                    bVal = new Date($(b).data('date'));
                    return bVal - aVal;
                default:
                    return 0;
            }
        });
        
        container.empty();
        $.each(items, function(_, item) {
            container.append(item);
        });
    });

    $('#prevPage').on('click', function(e) {
        e.preventDefault();
        var text = $('.active-page').text();
        if (text) {
            var parts = text.split('/');
            if (parts.length === 2) {
                var current = parseInt(parts[0].trim());
                if (current > 1) {
                    window.location.href = '/reservations?page=' + (current - 1);
                }
            }
        }
    });
    
    $('#nextPage').on('click', function(e) {
        e.preventDefault();
        var text = $('.active-page').text();
        if (text) {
            var parts = text.split('/');
            if (parts.length === 2) {
                var current = parseInt(parts[0].trim());
                var total = parseInt(parts[1].trim());
                if (current < total) {
                    window.location.href = '/reservations?page=' + (current + 1);
                }
            }
        }
    });

    $('#goBackBtn').on('click', function(e) {
        e.preventDefault();
        window.history.back();
    });

    
    /**
     * Load passengers for dropdown
     */
    function loadPassengerDropdown() {
        $.ajax({
            url: '/profile/passengers/list',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var dropdown = $('#passengerDropdown');
                    if (!dropdown.length) return;
                    
                    dropdown.html('<option value="">Select a passenger</option>');
                    
                    $.each(response.data, function(index, passenger) {
                        var option = $('<option>')
                            .val(passenger._id)
                            .text(passenger.full_name + ' (' + passenger.passport_num + ')');
                        dropdown.append(option);
                    });
                }
            },
            error: function(xhr) {
                console.error('Error loading passengers:', xhr);
                showToast('Error loading passenger list', 'error');
            }
        });
    }

    /**
     * Open edit reservation modal with passenger selection
     */
    function openEditReservationModal(reservationId) {
        if (!reservationId) {
            showToast('Invalid reservation ID', 'error');
            return;
        }
        
        // Show loading state
        $('#editReservationModal .modal-body').html(
            '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading reservation details...</p></div>'
        );
        $('#editReservationModal').modal('show');
        
        $.ajax({
            url: '/reservations/' + reservationId + '/details',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var data = response.data;
                    
                    // Populate modal fields
                    $('#editReservationId').val(data._id);
                    $('#editBookingRef').text(data.booking_ref);
                    $('#editFlightInfo').text(
                        data.flight.airline + ' ' + data.flight.flight_number + 
                        ' - ' + data.flight.origin + ' → ' + data.flight.destination
                    );
                    
                    var departureDate = new Date(data.flight.departureTime);
                    $('#editDepartureInfo').text(
                        'Departure: ' + departureDate.toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    );
                    
                    var arrivalDate = new Date(data.flight.arrivalTime);
                    $('#editArrivalInfo').text(
                        'Arrival: ' + arrivalDate.toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    );
                    
                    // Set form values
                    $('#passengerDropdown').val(data.passengerId || '');
                    $('#editSeatNumber').val(data.seatNumber);
                    $('#editMealPreference').val(data.mealPreference);
                    $('#editSpecialRequests').val(data.specialRequests || '');
                    
                    // Store current values for price calculation
                    currentTotalPrice = data.total_price;
                    currentMeal = data.mealPreference;
                    selectedSeat = data.seatNumber;
                    currentFlightId = data.flight._id;
                    
                    // Load seat map
                    loadSeatMap(data.flight._id, data._id);
                    
                    // Load passenger dropdown
                    loadPassengerDropdown();
                    
                    // Update modal content
                    $('#editReservationModal .modal-body').html($('#editReservationForm').html());
                    
                } else {
                    showToast(response.message || 'Error loading reservation details', 'error');
                    $('#editReservationModal').modal('hide');
                }
            },
            error: function(xhr) {
                console.error('Error loading reservation details:', xhr);
                showToast('Error loading reservation details', 'error');
                $('#editReservationModal').modal('hide');
            }
        });
    }

    /**
     * Load seat map
     */
    function loadSeatMap(flightId, reservationId) {
        $.ajax({
            url: '/reservations/' + flightId + '/seats',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var data = response.data;
                    var seatMap = $('#seatMap');
                    if (!seatMap.length) return;
                    
                    seatMap.empty();
                    
                    // Create seat layout
                    var rows = ['A', 'B', 'C', 'D', 'E', 'F'];
                    var maxRows = 10;
                    
                    // Add row labels and seats
                    for (var row = 1; row <= maxRows; row++) {
                        var rowDiv = $('<div>').addClass('seat-row');
                        
                        // Row number
                        var rowLabel = $('<div>').addClass('row-label').text(row);
                        rowDiv.append(rowLabel);
                        
                        // Seats
                        for (var col = 0; col < rows.length; col++) {
                            var seatNumber = row + rows[col];
                            var seatDiv = $('<div>').addClass('seat').data('seat', seatNumber);
                            
                            var seatData = data.allSeats.find(function(s) {
                                return s.seat === seatNumber;
                            });
                            
                            if (seatData) {
                                if (seatData.isOccupied) {
                                    seatDiv.addClass('occupied').attr('title', 'Occupied');
                                } else {
                                    seatDiv.addClass('available').attr('title', 'Available');
                                    seatDiv.on('click', function() {
                                        selectSeatInMap($(this).data('seat'));
                                    });
                                }
                            }
                            
                            seatDiv.text(seatNumber);
                            rowDiv.append(seatDiv);
                        }
                        
                        seatMap.append(rowDiv);
                    }
                    
                    // Highlight current seat
                    var currentSeat = $('#editSeatNumber').val();
                    if (currentSeat) {
                        highlightSelectedSeatInMap(currentSeat);
                    }
                    
                    // Update available seats count
                    var availableCount = data.allSeats.filter(function(s) {
                        return !s.isOccupied;
                    }).length;
                    
                    var availableInfo = $('#availableSeatsInfo');
                    if (availableInfo.length) {
                        availableInfo.html(
                            '<strong>' + availableCount + '</strong> seats available out of ' + data.totalSeats
                        );
                    }
                }
            },
            error: function(xhr) {
                console.error('Error loading seat map:', xhr);
                showToast('Error loading seat map', 'error');
            }
        });
    }

    /**
     * Select a seat in the map
     */
    function selectSeatInMap(seatNumber) {
        $('#editSeatNumber').val(seatNumber);
        highlightSelectedSeatInMap(seatNumber);
        selectedSeat = seatNumber;
    }

    /**
     * Highlight selected seat in the map
     */
    function highlightSelectedSeatInMap(seatNumber) {
        $('.seat').each(function() {
            $(this).removeClass('selected');
            if ($(this).data('seat') === seatNumber) {
                $(this).addClass('selected');
            }
        });
    }

    /**
     * Update reservation with passenger and seat changes
     */
    function updateReservationWithPassenger() {
        var reservationId = $('#editReservationId').val();
        var passengerId = $('#passengerDropdown').val();
        var seatNumber = $('#editSeatNumber').val();
        var mealPreference = $('#editMealPreference').val();
        var specialRequests = $('#editSpecialRequests').val();

        // Validate required fields
        if (!passengerId) {
            showToast('Please select a passenger', 'error');
            return;
        }
        
        if (!seatNumber) {
            showToast('Please select a seat', 'error');
            return;
        }

        var data = {
            passengerId: passengerId,
            seatNumber: seatNumber,
            mealPreference: mealPreference,
            specialRequests: specialRequests
        };

        var submitBtn = $('#saveReservationEdit');
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Saving...');

        $.ajax({
            url: '/reservations/' + reservationId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    showToast('Reservation updated successfully!', 'success');
                    $('#editReservationModal').modal('hide');
                    location.reload();
                } else {
                    showToast(response.message || 'Error updating reservation', 'error');
                    submitBtn.prop('disabled', false).html('Update Reservation');
                }
            },
            error: function(xhr) {
                var response = xhr.responseJSON;
                showToast(response?.message || 'Error updating reservation', 'error');
                submitBtn.prop('disabled', false).html('Update Reservation');
            }
        });
    }

    /**
     * Close edit reservation modal
     */
    function closeEditReservationModal() {
        $('#editReservationModal').modal('hide');
    }

    // Edit reservation button click
    $(document).on('click', '.edit-reservation-btn', function(e) {
        e.preventDefault();
        var reservationId = $(this).data('reservation-id');
        openEditReservationModal(reservationId);
    });

    // Close modal button
    $(document).on('click', '.close-edit-modal', function(e) {
        e.preventDefault();
        closeEditReservationModal();
    });

    // Save reservation edit
    $(document).on('click', '#saveReservationEdit', function(e) {
        e.preventDefault();
        updateReservationWithPassenger();
    });

    // Close modal when clicking outside
    $(document).on('click', '#editReservationModal', function(e) {
        if ($(e.target).is('#editReservationModal')) {
            closeEditReservationModal();
        }
    });

    // Close modal with Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#editReservationModal').is(':visible')) {
            closeEditReservationModal();
        }
    });

    $(document).on('change', '#passengerDropdown', function() {
        var selectedPassengerId = $(this).val();
        if (selectedPassengerId) {
            // Optionally update passenger info display
            $.ajax({
                url: '/profile/passengers/' + selectedPassengerId,
                method: 'GET',
                success: function(response) {
                    if (response.success) {
                        var passenger = response.data;
                        $('#passengerInfoDisplay').html(
                            '<strong>' + passenger.full_name + '</strong><br>' +
                            'Passport: ' + passenger.passport_num + '<br>' +
                            'Nationality: ' + passenger.nationality
                        );
                    }
                },
                error: function() {
                    // Silently fail - passenger info not critical
                }
            });
        } else {
            $('#passengerInfoDisplay').empty();
        }
    });

    // Load passenger dropdown if edit modal is present on page load
    if ($('#passengerDropdown').length) {
        loadPassengerDropdown();
    }

    // Preload seat map if edit modal is already open
    if ($('#editReservationModal').is(':visible') && $('#seatMap').length) {
        var flightId = $('#editFlightId').val();
        var reservationId = $('#editReservationId').val();
        if (flightId && reservationId) {
            loadSeatMap(flightId, reservationId);
        }
    }
});
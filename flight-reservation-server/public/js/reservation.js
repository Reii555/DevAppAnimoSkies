$(document).ready(function() {
    
    // ============================================================
    // TOAST NOTIFICATION 
    // ============================================================
    function showToast(message, type) {
        var toast = $('#toastMsg');
        var toastText = $('#toastText');
        
        toast.removeClass('success error warning info show');
        
        if (type === 'success') {
            toast.addClass('success');
        } else if (type === 'error') {
            toast.addClass('error');
        } else if (type === 'warning') {
            toast.addClass('warning');
        } else {
            toast.addClass('info');
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

    // ============================================================
    // EXPAND / COLLAPSE 
    // ============================================================
    $(document).on('click', '.res-summary', function(e) {
        // Prevent expanding if clicking a button or link
        if ($(e.target).is('button') || $(e.target).closest('button').length || $(e.target).is('a')) {
            return;
        }
        
        var item = $(this).closest('.reservation-item');
        var detail = item.find('.res-detail');
        var icon = $(this).find('.res-expand-icon');

        detail.slideToggle(200);
        icon.toggleClass('fa-chevron-down fa-chevron-up');
    });

    // ============================================================
    // VIEW DETAILS MODAL
    // ============================================================
    $(document).on('click', '.view-details', function(e) {
        e.preventDefault();
        var reservationId = $(this).data('id');
        
        $('#detailsContent').html('<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Loading...</p></div>');
        $('#detailsModal').modal('show');
        
        $.ajax({
            url: '/reservations/details/' + reservationId,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var data = response.data;
                    var html = '';
                    
                    var bookingDate = new Date(data.booking_date);
                    var formattedDate = bookingDate.toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    var departureDate = new Date(data.flight.departureTime);
                    var formattedDeparture = departureDate.toLocaleDateString('en-PH', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    var statusClass = '';
                    if (data.status === 'Confirmed') statusClass = 'success';
                    else if (data.status === 'Pending') statusClass = 'warning';
                    else if (data.status === 'Cancelled') statusClass = 'danger';
                    else statusClass = 'secondary';
                    
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
                        html += '<hr><p><strong>Special Requests:</strong> ' + data.specialRequests + '</p>';
                    }
                    
                    $('#detailsContent').html(html);
                } else {
                    showToast(response.message || 'Error loading reservation details', 'error');
                }
            },
            error: function() {
                showToast('Error loading reservation details', 'error');
                $('#detailsContent').html('<p class="text-danger text-center">Error loading details. Please try again.</p>');
            }
        });
    });

    // ============================================================
    // 5. EDIT SEAT MODAL
    // ============================================================
    var currentReservationId = null;
    var selectedSeat = null;
    var currentFlightId = null;
    var currentTotalPrice = 0;

    $(document).on('click', '.edit-seat', function(e) {
        e.preventDefault();
        
        var reservationId = $(this).data('id');
        var seat = $(this).data('seat');
        var meal = $(this).data('meal');
        var price = $(this).data('price');
        
        if (!reservationId) {
            showToast('Invalid reservation ID', 'error');
            return;
        }
        
        currentReservationId = reservationId;
        selectedSeat = seat || null;
        currentTotalPrice = parseFloat(price) || 0;
        currentFlightId = null;
        
        $('#editReservationId').val(reservationId);
        $('#editSelectedSeat').text(seat || 'None');
        $('#editMealPreference').val(meal || 'Standard');
        $('#editSpecialRequests').val('');
        $('#editCurrentPrice').text('₱' + currentTotalPrice.toFixed(2));
        $('#editTotalPrice').text('₱' + currentTotalPrice.toFixed(2));
        updateMealPriceDisplay();
        calculateTotalPrice();

        $('.extra-service-toggle').prop('checked', false);
        
        $('#editSeatGrid').html('<div class="py-3"><i class="fas fa-spinner fa-spin"></i> Loading seats...</div>');
        $('#editFlightInfo').html('<p class="mb-1 text-muted small"><i class="fas fa-spinner fa-spin"></i> Loading flight info...</p>');
        
        // Load Flight Info
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
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    $('#editFlightInfo').html(
                        '<strong>' + flightData.flight_number + '</strong> - ' + flightData.airline + '<br>' +
                        '<small>' + flightData.origin + ' → ' + flightData.destination + '</small><br>' +
                        '<small>Departure: ' + formattedDeparture + '</small>'
                    );
                    
                    if (currentFlightId) {
                        loadSeats(currentFlightId, reservationId);
                        loadPassengerDropdown();
                    } else {
                        $('#editSeatGrid').html('<p class="text-danger text-center">Could not find flight ID</p>');
                    }
                } else {
                    showToast(detailResponse.message || 'Error loading flight', 'error');
                }
            },
            error: function() {
                showToast('Error loading flight information', 'error');
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
                    var rows = ['A', 'B', 'C', 'D', 'E', 'F'];
                    var maxRows = 10;
                    
                    seatsHtml += '<div class="seat-map-container">';
                    
                    // Legend
                    seatsHtml += '<div class="seat-legend">';
                    seatsHtml += '  <span class="legend-item"><span class="legend-color available"></span> Available</span>';
                    seatsHtml += '  <span class="legend-item"><span class="legend-color occupied"></span> Occupied</span>';
                    seatsHtml += '  <span class="legend-item"><span class="legend-color selected"></span> Selected</span>';
                    seatsHtml += '</div>';
                    
                    // Seats
                    for (var row = 1; row <= maxRows; row++) {
                        seatsHtml += '<div class="seat-row">';
                        seatsHtml += '<div class="row-label">' + row + '</div>';
                        
                        for (var col = 0; col < rows.length; col++) {
                            var seatNumber = row + rows[col];
                            var seatData = data.allSeats.find(function(s) { return s.seat === seatNumber; });
                            
                            var seatClass = 'seat';
                            var isClickable = true;
                            
                            if (seatData && seatData.isOccupied) {
                                seatClass += ' occupied';
                                isClickable = false;
                            } else if (selectedSeat === seatNumber) {
                                seatClass += ' selected';
                            } else {
                                seatClass += ' available';
                            }
                            
                            seatsHtml += '<div class="' + seatClass + '" data-seat="' + seatNumber + '" ' + (isClickable ? 'onclick="selectSeat(\'' + seatNumber + '\')"' : '') + '>' + seatNumber + '</div>';
                        }
                        seatsHtml += '</div>';
                    }
                    
                    seatsHtml += '</div>';
                    
                    $('#editSeatGrid').html(seatsHtml);
                    
                    if (selectedSeat) {
                        $('#editSelectedSeat').text(selectedSeat);
                    }
                    
                    var availableCount = data.allSeats.filter(function(s) { return !s.isOccupied; }).length;
                    $('#availableSeatsCount').text(availableCount + ' seats available');
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

    // Seat Selector
    window.selectSeat = function(seatNumber) {
        selectedSeat = seatNumber;
        $('#editSelectedSeat').text(seatNumber);
        $('.seat').removeClass('selected');
        $('.seat[data-seat="' + seatNumber + '"]').addClass('selected');
    };

    // ============================================================
    // LOAD PASSENGER DROPDOWN
    // ============================================================
    function loadPassengerDropdown() {
        $.ajax({
            url: '/profile/passengers/list',
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    var dropdown = $('#passengerDropdown');
                    dropdown.html('<option value="">Select a passenger</option>');
                    
                    $.each(response.data, function(index, passenger) {
                        var option = $('<option>').val(passenger._id).text(passenger.full_name + ' (' + passenger.passport_num + ')');
                        dropdown.append(option);
                    });
                }
            },
            error: function(xhr) {
                console.error('Error loading passengers:', xhr);
            }
        });
    }

    // ============================================================
    // PRICE CALCULATOR
    // ============================================================
    function updateMealPriceDisplay() {
        var price = mealPrices[$('#editMealPreference').val()] || 0;
        $('#mealPriceDisplay').text(price > 0 ? '(+₱' + price + ')' : '(Included)');
        calculateTotalPrice();
    }

    function calculateTotalPrice() {
        var mealPrice = mealPrices[$('#editMealPreference').val()] || 0;
        var extrasTotal = 0;
        
        $('.extra-service-toggle:checked').each(function() {
            extrasTotal += parseFloat($(this).data('price')) || 0;
        });
        
        var newTotal = currentTotalPrice + mealPrice + extrasTotal;
        $('#editTotalPrice').text('₱' + newTotal.toFixed(2));
    }

    $('#editMealPreference').on('change', function() {
        updateMealPriceDisplay();
    });
    
    $(document).on('change', '.extra-service-toggle', function() {
        calculateTotalPrice();
    });

    // ============================================================
    // SAVE CHANGES
    // ============================================================
    $('#saveSeatEdit').on('click', function(e) {
        e.preventDefault();
        
        var reservationId = $('#editReservationId').val();
        var passengerId = $('#passengerDropdown').val();
        var mealPreference = $('#editMealPreference').val();
        var specialRequests = $('#editSpecialRequests').val().trim();
        
        var selectedExtras = [];
        var extrasTotal = 0;
        $('.extra-service-toggle:checked').each(function() {
            var name = $(this).data('name');
            var price = parseFloat($(this).data('price')) || 0;
            selectedExtras.push({ name: name, price: price });
            extrasTotal += price;
        });
        
        if (!passengerId) {
            showToast('Please select a passenger', 'error');
            return;
        }
        if (!selectedSeat) {
            showToast('Please select a seat', 'error');
            return;
        }
        
        var submitBtn = $(this);
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Saving...');
        
        $.ajax({
            url: '/reservations/' + reservationId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                passengerId: passengerId,
                seatNumber: selectedSeat,
                mealPreference: mealPreference,
                specialRequests: specialRequests,
                extraServices: selectedExtras,
                extraServicesPrice: extrasTotal
            }),
            success: function(response) {
                if (response.success) {
                    showToast('Reservation updated successfully!', 'success');
                    setTimeout(function() {
                        $('#editSeatModal').modal('hide');
                        location.reload();
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

    // ============================================================
    // CANCEL RESERVATION
    // ============================================================
    var cancelReservationId = null;
    
    $(document).on('click', '.cancel-reservation', function(e) {
        e.preventDefault();
        cancelReservationId = $(this).data('id');
        $('#modalBookingRef').text($(this).data('ref'));
        $('#modalBookingPassenger').text($(this).data('passenger'));
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
                    $('#cancelModal').modal('hide');
                    setTimeout(function() { location.reload(); }, 1000);
                } else {
                    showToast(response.message || 'Error cancelling reservation', 'error');
                    submitBtn.prop('disabled', false).html('Yes, Cancel');
                }
            },
            error: function() {
                showToast('Error cancelling reservation', 'error');
                submitBtn.prop('disabled', false).html('Yes, Cancel');
            }
        });
    });

    // ============================================================
    // SEARCH, FILTER, SORT
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

    // ============================================================
    // PAGINATION & BACK BUTTON
    // ============================================================
    $('#prevPage').on('click', function() {
        if (!$(this).prop('disabled')) {
            var text = $('.active-page').text();
            var current = parseInt(text.split('/')[0].trim());
            window.location.href = '/reservations?page=' + (current - 1);
        }
    });
    
    $('#nextPage').on('click', function() {
        if (!$(this).prop('disabled')) {
            var text = $('.active-page').text();
            var current = parseInt(text.split('/')[0].trim());
            window.location.href = '/reservations?page=' + (current + 1);
        }
    });

    $('#goBackBtn').on('click', function(e) {
        e.preventDefault();
        window.history.back();
    });
});
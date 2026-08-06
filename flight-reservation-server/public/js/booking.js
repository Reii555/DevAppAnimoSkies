let passengerCount = 1;
let baseFlightPrice = 0;
let passengerIds = [];
let seatNums = [];

// FUNCTIONS
// Passenger Validation
function validatePassenger() {
    let valid = true;

    let fullName = $("#fullName").val().trim(); 
    let email = $("#email").val().trim(); 
    let contact = $("#contactNum").val().trim(); 
    let passportNum = $("#passportNum").val();  
    let nationality = $("#nationality").val();  
    let birthDate = $("#birthDate").val();  
    let gender = $("#gender").val();  

    if(fullName === "") {
        $("#nameError").text("Full Name cannot be empty.");
        valid = false;
    } else {
        $("#nameError").text(" ");
    }

    if(!email.includes("@")) {
        $("#emailError").text("Email Invalid.");
        valid = false;
    } else {
        $("#emailError").text(" ");
    }

    if(contact.length < 11) {
        $("#contactError").text("Contact Number Invalid.");
        valid = false;
    } else {
        $("#contactError").text(" ");
    }

    if(passportNum === "") {
        $("#passportError").text("Passport Number cannot be empty.");
        valid = false;
    } else {
        $("#passportError").text(" ");
    }

    if(nationality === "") {
        $("#nationalityError").text("Nationality cannot be empty.");
        valid = false;
    } else {
        $("#nationalityError").text(" ");
    }

    if(birthDate === "") {
        $("#birthDateError").text("Date of Birth cannot be empty.");
        valid = false;
    } else {
        $("#birthDateError").text(" ");
    }

    if(gender === "") {
        $("#genderError").text("Gender cannot be empty.");
        valid = false;
    } else {
        $("#genderError").text(" ");
    }

    return valid;
}

// Emergency Contact Validation
function validateEmergency() {
    let valid = true;

    let fullName = $("#name_emergency").val().trim();
    let email = $("#email_emergency").val().trim(); 
    let contact = $("#contact_emergency").val().trim(); 
    let relationship = $("#rel_emergency").val();  

    if(fullName === "") {
        $("#name_emError").text("Full Name cannot be empty.");
        valid = false;
    } else {
        $("#name_emError").text(" ");
    }

    if(!email.includes("@")) {
        $("#email_emError").text("Email Invalid.");
        valid = false;
    } else {
        $("#email_emError").text(" ");
    }

    if(contact.length < 11) {
        $("#contact_emError").text("Contact Number Invalid.");
        valid = false;
    } else {
        $("#contact_emError").text(" ");
    }

    if(relationship == "") {
        $("#rel_emError").text("Relationship cannot be empty.");
        valid = false;
    } else {
        $("#rel_emError").text(" ");
    }

    return valid;
}

// Get and Update Selected Seats 
function updateSelectedSeats() {

    let selected = [];

    $('.seat.selected').each(function () {
        selected.push($(this).text());
       });

    // update sidebar
    if (selected.length == 0) {
        $('#selectedSeat').text('None');
    } else {
        $('#selectedSeat').text(selected.join(', '));
    }
}

// get and update occupied seats
function disableOccupiedSeats(seats){

    $('.seat').each(function(){

        const seatNumber = $(this).text().trim();
        const seat = seats.find(s => s.seatNumber === seatNumber);

        if (seat && seat.status === "Occupied"){

            $(this)
                .removeClass('btn-outline-success btn-outline-warning')
                .addClass('btn-secondary')
                .prop('disabled', true);
        }

    });

}

// Get and Update Selected Meal 
function updateSelectedMeal() {

    let mealName = $('.meal-card.selected h5').text();
    let mealPrice = $('.meal-card.selected .meal_price').text();

    if (mealName === "") {
        $('#selectedMeal').text("[Standard] Included");
    } else {
        $('#selectedMeal').text("[" + mealName + "] " + mealPrice);
    }

}

// Get and Update Passenger Count 
function updatePassengerCount() {
    $('#passengerCount').text(passengerCount);
}

// update extra services
function updateExtraServices() {

    let baggageTotal = $('#checkedBag').val() * 600;
    let carryTotal = $('#carryBag').val() * 300;

    let priorityTotal = 0;
    let insuranceTotal = 0;
    let loungeTotal = 0;

    if ($('#priorityBoard').prop('checked')) {
        priorityTotal = 500;
    }

    if ($('#travelIns').prop('checked')) {
        insuranceTotal = 700;
    }

    if ($('#loungeAccess').prop('checked')) {
        loungeTotal = 1000;
    }

    $('#baggageCost').text('₱' + baggageTotal);
    $('#carryonCost').text('₱' + carryTotal);
    $('#priorityCost').text('₱' + priorityTotal);
    $('#insuranceCost').text('₱' + insuranceTotal);
    $('#loungeCost').text('₱' + loungeTotal);

    let total =
        baggageTotal +
        carryTotal +
        priorityTotal +
        insuranceTotal +
        loungeTotal;

    $('#extrasTotal').text(total);

    return total;
}

// get meal price
function getMealPrice() {

    let price = $('.meal-card.selected .meal_price').text();

    if (price === "" || price === "Included") {
        return 0;
    }

    return parseInt(price.replace('+ ₱', ''));
}

// calculate and update total book price
function updateTotalPrice() {
    let mealPrice = getMealPrice();
    let extraPrice = updateExtraServices();

    // get number of seats
    let count = $('.seat.selected').length;

    let total = baseFlightPrice * count;

    $('.seat.selected').each(function () {

        let seat = $(this).text().trim();

        // get the number from the seat code (if 1-3, there's premium fee)
        let row = parseInt(seat);

        if (row <= 3) {
            total += 500; // premium seat price
        } 

    });

    total += mealPrice + extraPrice;

    $('#totalPrice').text("₱" + total);
}


// EVENTS
$(document).ready(function(){
    $.ajax({
        url: window.location.pathname + "/price",
        method: "GET",

        success: function(flight){
            baseFlightPrice = flight.basePrice;
            updateTotalPrice();
        }
    });

    // If [add passenger] is clicked, another passenger card is created
    $("#addPassenger").click(function(){

        passengerCount++;
        updatePassengerCount();

        $("#passengerContainer").append(`
            <div class="card border p-3 mt-4 mb-3 passenger-card">

                <h5>Passenger</h5>

                <div class="row g-3">

                    <div class="col-md-6">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-control fullName" name="fullName">
                        <div class="text-danger small" id="nameError"></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-control email" name="email">
                        <div class="text-danger small" id="emailError"></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Contact Number</label>
                        <input type="tel" class="form-control contactNum" name="contactNum">
                        <div class="text-danger small" id="contactError"></div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Passport Number</label>
                        <input type="text" class="form-control passportNum" name="passportNum">
                        <div class="text-danger small" id="passportError"></div>
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Nationality</label>
                        <select class="form-select nationality" name="nationality">
                            <option value="">Select Nationality</option>
                            <option>Filipino</option>
                            <option>American</option>
                            <option>Japanese</option>
                            <option>Chinese</option>
                            <option>Korean</option>
                            <option>British</option>
                            <option>Australian</option>
                            <option>Canadian</option>
                            <option>Other</option>
                        </select>
                        <div class="text-danger small" id="nationalityError"></div>
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Date of Birth</label>
                        <input type="date" class="form-control birthDate" name="birthDate">
                        <div class="text-danger small" id="birthDateError"></div>
                    </div>

                    <div class="col-md-4">
                        <label class="form-label">Gender</label>
                        <select class="form-select gender" name="gender">
                            <option value="">Select Gender</option>
                            <option>Male</option>
                            <option>Female</option>
                        </select>
                        <div class="text-danger small" id="genderError"></div>
                    </div>

                </div>

                </div>

                <div class="card border p-3 mb-3 passenger-card">

                    <h5>Emergency Contact</h5>

                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-control name_emergency">
                            <div class="text-danger small" id="name_emError"></div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Relationship</label>
                            <input type="text" class="form-control rel_emergency">
                            <div class="text-danger small" id="rel_emError"></div>
                        </div>

                         <div class="col-md-6">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control email_emergency">
                            <div class="text-danger small" id="email_emError"></div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Contact Number</label>
                            <input type="tel" class="form-control contact_emergency">
                            <div class="text-danger small" id="contact_emError"></div>
                        </div>

                    </div>

                </div>

                <button type="button" class="btn btn-primary savePassenger">Save Passenger</button>

        `);

    });

    $(document).on("change", ".savedPassengers", function () {

        let passengerCard = $(this).closest(".passenger-card");
        let emergencyCard = passengerCard.next(".passenger-card");

        const selected = $(this).find(":selected");

        passengerCard.find(".fullName").val(selected.data("name"));
        passengerCard.find(".email").val(selected.data("email"));
        passengerCard.find(".contactNum").val(selected.data("contact"));
        passengerCard.find(".passportNum").val(selected.data("passport"));
        passengerCard.find(".nationality").val(selected.data("nationality"));
        passengerCard.find(".birthDate").val(selected.data("birth"));
        passengerCard.find(".gender").val(selected.data("gender"));
        passengerCard.find(".passengerId").val(selected.val());

        const emergency = (selected.data("emergency") || "").split("|");

        emergencyCard.find(".name_emergency").val((emergency[0] || "").trim());
        emergencyCard.find(".rel_emergency").val((emergency[1] || "").trim());
        emergencyCard.find(".email_emergency").val((emergency[2] || "").trim());
        emergencyCard.find(".contact_emergency").val((emergency[3] || "").trim());
        
    });

    $(document).on("click", ".savePassenger", function () {

        // if email already exists for this user, dont save in the database

        let emergencyCard = $(this).prev(".passenger-card");
        let passengerCard = emergencyCard.prev(".passenger-card");

        let fullName = passengerCard.find(".fullName").val().trim();
        let contactNum = passengerCard.find(".contactNum").val().trim();
        let email = passengerCard.find(".email").val().trim();
        let passportNum = passengerCard.find(".passportNum").val().trim();
        let nationality = passengerCard.find(".nationality").val();
        let birthDate = passengerCard.find(".birthDate").val();
        let gender = passengerCard.find(".gender").val();
        let emergencyContact = emergencyCard.find(".name_emergency").val().trim() + " | " + emergencyCard.find(".rel_emergency").val() + " | " + emergencyCard.find(".contact_emergency").val().trim();

        let existingPassengerId = passengerCard.find(".passengerId").val();

        if (existingPassengerId) {

            if (!passengerIds.includes(existingPassengerId)) {
                passengerIds.push(existingPassengerId);
            }

            alert("Passenger saved!");

            return;
        }

        $.ajax({

            url: "/booking/save",
            method: "POST",

            data: {

                full_name: fullName,
                contact_num: contactNum,
                email: email,
                passport_num: passportNum,
                nationality: nationality,
                birth_date: birthDate,
                gender: gender,
                emergency_contact: emergencyContact

            },

            success: function(passenger){

                passengerIds.push(passenger._id);

                alert("Passenger saved!");

            },

            error:function(xhr){

                console.log(xhr);
                alert("Save failed.");

            }

        });

    });

    // if save passenger button is pressed but data is invalid/data is valid
    $("#saveEmergency").click(function (){

        if(!validateEmergency()){
                return;
        }
    });

    // create the seat map
    const seats = ['A', 'B', 'C', 'D', 'E', 'F'];

    for(let row = 1; row <= 10; row++) {

        // display row numbers
        let seatRow = `
            <div class="row text-center mb-2 align-items-center">
                <div class="col">${row}</div>
        `;

        // display seats for the left side of the aisle
        for(let i = 0; i < 3; i++) {
            
            let seatClass;

            if (row <= 3) {
                seatClass = 'btn-outline-warning premium';
            } else {
                seatClass = 'btn-outline-success';
            }

            seatRow += `
                <div class="col">
                    <button class="btn ${seatClass} text-nowrap seat">
                        ${row}${seats[i]}
                    </button>
                </div>
            `;

            // seatRow is now = [row#Letter]
        }

        seatRow += `<div class="col"></div>`; // spacer for the aisle

        // display seats for the right side of the aisle
        for(let i = 3; i < 6; i++) {

            let seatClass;

            if (row <= 3) {
                seatClass = 'btn-outline-warning premium';
            } else {
                seatClass = 'btn-outline-success';
            }

            seatRow += `
                <div class="col">
                    <button class="btn ${seatClass} text-nowrap seat">
                        ${row}${seats[i]}
                    </button>
                </div>
            `;
        }

        seatRow += `</div>`;

        $('#seatRows').append(seatRow);
    }

    // occupied seats
    $.ajax({

        url: window.location.pathname + "/seats",
        method: "GET",

        success: function(occupiedSeats){

            disableOccupiedSeats(occupiedSeats);
        },

        error: function(xhr){
            console.log(xhr);
        }

    });

    // when a seat is chosen
    $(".seat").click(function () {

        if ($(this).prop("disabled")) {
            return;
        }

        // PREMIUM SEAT
        if ($(this).hasClass("premium")) {

            if ($(this).hasClass("selected")) {

                $(this).removeClass("selected btn-warning text-dark").addClass("btn-outline-warning");

            } else {

                $(this).removeClass("btn-outline-warning").addClass("selected btn-warning text-dark");
            }
        }

        // NON PREMIUM SEAT
        else {
            if ($(this).hasClass("selected")) {

                $(this).removeClass("selected btn-success text-white").addClass("btn-outline-success");

            } else {

                $(this).removeClass("btn-outline-success").addClass("selected btn-success text-white");
            }

        }

        // if seat already exists in the array, remove it. if it doesn't, add it.
        
        const seat = $(this).text().trim();

        if (seatNums.includes(seat)) {

            seatNums = seatNums.filter(s => s !== seat); // remove

        } else {
            seatNums.push(seat); // add
        }

        console.log("added: ", seat);
        console.log(seatNums);

        updateSelectedSeats();
        updateTotalPrice();

    });

    // display meal cards
    $.ajax({
        url: "/booking/meals",
        method: "GET",

        success: function(meals){

            meals.forEach(meal => {

                let priceText;

                if (meal.additional_price == 0) {
                    priceText = "Included";
                } else {
                    priceText = "+ ₱" + meal.additional_price;
                }

                $("#mealContainer").append(`
                    <div class="col-md-4">
                        <div class="card meal-card h-100">
                            <div class="card-body">
                                <h5>${meal.meal_name}</h5>
                                <p class="text-muted">${meal.description}</p>
                                <p class="meal_price">${priceText}</p>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
    });

    // when a meal is chosen
    $("#mealContainer").on("click", ".meal-card", function () {

        $(".meal-card").removeClass("selected");

        $(this).addClass("selected");

        updateSelectedMeal();
        updateTotalPrice();

    });

    // when an extra service is updated
    $(".extra_serv").click(function (){
        updateExtraServices();
        updateTotalPrice(); 
    });

    $("#bookFlight").click(function(){
        const flightId = window.location.pathname.split("/").pop();
        const bookingRef = Math.random().toString(36).substring(2,10).toUpperCase();

        let seatNumber = $(".seat.selected").first().text().trim();
        let mealPreference = $(".meal-card.selected h5").text() || "Standard";
        let mealPrice = getMealPrice();
        let checkedBaggage = Number($("#checkedBag").val());
        let carryOn = Number($("#carryBag").val());
        let priorityBoarding = $("#priorityBoard").is(":checked");
        let travelInsurance = $("#travelIns").is(":checked");
        let loungeAccess = $("#loungeAccess").is(":checked");
        let extraServicesPrice = updateExtraServices();
        let totalPrice = Number($("#totalPrice").text().replace("₱", ""));
        
        passengerIds.forEach(function(passengerId, index) {

            console.log("passengers for reservation ", bookingRef, ":", passengerId);
            console.log("seats for reservation ", bookingRef, ":", seatNums);

            $.ajax({

                url: "/booking/reserve",
                method: "POST",

                data: {

                    passengerId: passengerId,
                    flightId: flightId,
                    seatNumber: seatNums[index],
                    mealPreference: mealPreference,
                    mealPrice: mealPrice,

                    extraServices: {
                        checkedBaggage: checkedBaggage,
                        carryOn: carryOn,
                        priorityBoarding: priorityBoarding,
                        travelInsurance: travelInsurance,
                        loungeAccess: loungeAccess
                    },

                    extraServicesPrice: extraServicesPrice,
                    total_price: totalPrice,
                    specialRequests: "N/A",
                    booking_ref: bookingRef

                },

                success: function(reservation) {
                    console.log("Reservation saved:", reservation);
                },

                error: function(xhr) {
                    console.log(xhr);
                }

            });

        });

        setTimeout(function() {
            alert("Reservation Successful!");
            window.location.href = "/search";
        }, 1000);
    });

});
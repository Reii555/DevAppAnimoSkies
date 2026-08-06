let currentPage = 1;
let rowsPerPage = 5;

let selectedFlightIndex = -1;
let filteredFlights = [];

let editMode = false;
let selectedFlightId = null;

 //for access alert in route
const params = new URLSearchParams(window.location.search);
const error = params.get("error");

if(error){
    alert(error);
}

//statistics
function updateStatistics() {

    $.ajax({
        url: "/admin-flights/data",
        method: "GET",

        success: function (flights) {
            $("#totalFlights").text(flights.length);
            $("#ongoingFlights").text(flights.filter(flight => flight.status === "Ongoing").length);
            $("#delayedFlights").text(flights.filter(flight => flight.status === "Delayed").length);
            $("#cancelledFlights").text(flights.filter(flight => flight.status === "Cancelled").length);
        },

        error: function (error) {
            console.error("Error updating statistics:", error);
        }
    });
}

// format arrival and departure times
function formatDateTime(dateTime) {

    if (!dateTime) {
        return "";
    }

    let date = new Date(dateTime);

    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");
    let hours = String(date.getHours()).padStart(2, "0");
    let minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

//initialize
function initializeFlight(flight) {

    $("#flight_number").val(flight.flight_number);
    $("#airline").val(flight.airline);
    $("#cabinClass").val(flight.cabinClass);

    $("#origin").val(flight.origin);
    $("#destination").val(flight.destination);

    $("#departureTime").val(formatDateTime(flight.departureTime));
    $("#arrivalTime").val(formatDateTime(flight.arrivalTime));

    $("#duration").val(flight.duration);
    $("#tripType").val(flight.tripType);

    $("#availableSeats").val(flight.availableSeats);
    $("#basePrice").val(flight.basePrice);
    $("#checkedIn").val(flight.checkedIn);
    $("#carryOn").val(flight.carryOn);

    $("#layoversCount").val(flight.layoversCount);
    $("#layoverDetails").val(flight.layoverDetails);

    $("#status").val(flight.status);
}

//render
function renderFlights(data) {

    let startIndex = (currentPage - 1) * rowsPerPage;
    let endIndex = startIndex + rowsPerPage;
    let paginatedData = data.slice(startIndex, endIndex);

    let html = "";

    paginatedData.forEach(function (flight, index) {

        let actualIndex = startIndex + index;
        let rowClass = "";

        if (actualIndex === selectedFlightIndex) {
            rowClass = "selected-row";
        }

        html += `
            <tr 
                class="flight-row ${rowClass}"
                data-index="${actualIndex}"
                data-id="${flight._id}">

                <td>${flight.flight_number}</td>
                <td>${flight.airline}</td>
                <td>${flight.cabinClass}</td>
                <td>${flight.origin} - ${flight.destination}</td>
                <td>${formatDateTime(flight.departureTime)}</td>
                <td>${formatDateTime(flight.arrivalTime)}</td>
                <td>${flight.duration}</td>
                <td>${flight.tripType}</td>
                <td>${flight.availableSeats}</td>
                <td>₱${flight.basePrice}</td>
                <td>${flight.checkedIn}</td>
                <td>${flight.carryOn}</td>
                <td>${flight.layoversCount}</td>
                <td>${flight.layoverDetails}</td>
                <td>${flight.status}</td>

            </tr>
        `;
        
    });

    $("#flightsTableBody").html(html);

    updatePagination(data.length);
}

// AJAX for search and filter
function applyFilters() {

    let searchValue = $("#searchFlight").val();
    let airlineFilter = $("#airlineFilter").val();
    let statusFilter = $("#statusFilter").val();
    let sortOption = $("#sortFlight").val();

    $.ajax({

        url: "/admin-flights/search",
        method: "GET",
        data: {

            search: searchValue,
            airline: airlineFilter,
            status: statusFilter
        },

        success: function (flights) {

            console.log("Flights:", flights); // for debugging

            filteredFlights = flights;

            // sorting
            filteredFlights.sort(function (a, b) {

                if (sortOption === "flight_number") {
                    return a.flight_number.localeCompare(b.flight_number);
                }
                if (sortOption === "airline") {
                    return a.airline.localeCompare(b.airline);
                }
                if (sortOption === "status") {
                    return a.status.localeCompare(b.status);
                }
                return 0;
            });


            currentPage = 1;
            selectedFlightIndex = -1;
            selectedFlightId = null;

            $("#editBtn").prop("disabled", true);
            $("#deleteBtn").prop("disabled", true);
            $("#selectedFlightLabel").text("No flight selected");

            renderFlights(filteredFlights);
        },

        error: function (error) {

            console.error("Error searching flights:", error);
        }
    });
}

//pagination
function updatePagination(totalRows) {

    let totalPages = Math.ceil(totalRows / rowsPerPage);

    if (totalPages === 0) { 
        totalPages = 1; 
    }

    $("#currentPage").text(currentPage);

    let start = ((currentPage - 1) * rowsPerPage) + 1;

    let end = Math.min(currentPage * rowsPerPage, totalRows);

    if (totalRows === 0) {
        start = 0;
        end = 0;
    }

    $("#paginationInfo").text( `Showing ${start} to ${end} of ${totalRows} flights`);

    $("#previousPage").prop( "disabled", currentPage === 1);

    $("#nextPage").prop("disabled", currentPage === totalPages);
}


//validations
async function validateFlightForm() {

    let valid = true;

    $(".text-danger").text("");
    $(".form-control").removeClass("is-invalid");
    $(".form-select").removeClass("is-invalid");

    let flight_number = $("#flight_number").val().trim();
    let airline = $("#airline").val().trim();
    let cabinClass = $("#cabinClass").val();
    let origin = $("#origin").val().trim();
    let destination = $("#destination").val().trim();
    let departureTime = $("#departureTime").val();
    let arrivalTime = $("#arrivalTime").val();
    let duration = $("#duration").val();
    let tripType = $("#tripType").val();
    let availableSeats = $("#availableSeats").val();
    let basePrice = $("#basePrice").val();
    let checkedIn = $("#checkedIn").val();
    let carryOn = $("#carryOn").val();
    let layoversCount = $("#layoversCount").val();
    let layoverDetails = $("#layoverDetails").val();
    let status = $("#status").val();

    //empty inputs
    if (flight_number === "") {
        $("#flightNumberError").text("Flight number is required.");
        $("#flight_number").addClass("is-invalid");
        valid = false;
    }
    if (airline === "") {

        $("#airlineError").text("Airline is required.");
        $("#airline").addClass("is-invalid");
        valid = false;
    }
    if (cabinClass === "") {
        $("#cabinClassError").text("Cabin Class is required.");
        $("#cabinClass").addClass("is-invalid");
        valid = false;
    }
    if (origin === "") {

        $("#originError").text("Origin is required.");
        $("#origin").addClass("is-invalid");
        valid = false;
    }
    if (destination === "") {

        $("#destinationError").text("Destination is required.");
        $("#destination").addClass("is-invalid");
        valid = false;
    }
    if (departureTime === ""){
        $("#departureTimeError").text("Departure date and time are required.");
        $("#departureTime").addClass("is-invalid");
        valid = false;
    }
    if (arrivalTime === "") {
        $("#arrivalTimeError").text("Arrival date and time are required.");
        $("#arrivalTime").addClass("is-invalid");
        valid = false;
    }
    if (duration === ""){
        $("#durationError").text("Flight duration is required.");
        $("#duration").addClass("is-invalid");
        valid = false;
    }
    if (tripType === ""){
        $("#tripTypeError").text("Trip type is required.");
        $("#tripType").addClass("is-invalid");
        valid = false;
    }
    if (availableSeats === "" || Number(availableSeats) <= 0) {

        $("#availableSeatsError").text("Available seats must be greater than 0.");
        $("#availableSeats").addClass("is-invalid");
        valid = false;
    }
    if (basePrice === "" || Number(basePrice) <= 0) {

        $("#basePriceError").text("Base price must be greater than 0.");
        $("#basePrice").addClass("is-invalid");
        valid = false;
    }
    if (checkedIn === "" || Number(checkedIn) <= 0) {
        $("#checkedInError").text("Checked In weight allowance must be greater than 0.");
        $("#checkedIn").addClass("is-invalid");
        valid = false;
    }
    if (carryOn === "" || Number(carryOn) <= 0) {
        $("#carryOnError").text("Carry On weight allowance must be greater than 0.");
        $("#carryOn").addClass("is-invalid");
        valid = false;
    }
    if (layoversCount === "") {
        $("#layoversCountError").text("Layover Count is required.");
        $("#layoversCount").addClass("is-invalid");
        valid = false;
    }
    if (layoverDetails === "") {
        $("#layoverDetailsError").text("Layover Details is required.");
        $("#layoverDetails").addClass("is-invalid");
        valid = false;
    }
    if (status === "") {
        $("#statusError").text("Flight status is required.");
        $("#status").addClass("is-invalid");
        valid = false;
    }

    //other validations
    //checks for duplicate flight ID
    if(flight_number != ""){
        try{
            let response = await $.ajax({
                url: "/admin-flights/check-flight-number",
                method: "GET",
                data: {
                    flight_number: flight_number,
                    flight_id: editMode ? selectedFlightId : null
                }
            });

            if(response.exists){
                $("#flightNumberError").text("Flight number already exists.");
                $("#flight_number").addClass("is-invalid");
                valid = false;
            }
        } catch (error){
            console.error("Flight number validation error:", error);
            $("#flightNumberError").text("Unable to validate flight ID.");
            $("#flight_number").addClass("is-invalid");
            valid = false;
        }
    }

    //date validations
    //arrival date should NOT be before departure date
    //if both departure date and arrival date occurs within the day,
    //arrival time should NOT be have the same time or before departure time
    if (departureTime !== "" && arrivalTime !== "") {
        if (arrivalTime <= departureTime) {
            $("#arrivalTimeError").text("Arrival date and time must be after departure date and time.");
            $("#arrivalTime").addClass("is-invalid");
            valid = false;
        }
    }

    //layoversCount
    //can be 0, but input should not be negative
    if (layoversCount !== ""){
        if(layoversCount < 0){
            $("#layoversCountError").text("Layover count should not be negative.");
            $("#layoversCount").addClass("is-invalid");
            valid = false;
        }
    }

    //route validation
    //origin should not be the same as the destination
    if(origin !== "" && destination !== "" && origin === destination){
        $("#destinationError").text("Destination should not be the same as the Origin.");
        $("#destination").addClass("is-invalid");
        valid = false;
    }
    return valid;
}


//clear form
function clearFlightForm() {

    $("#flight_number").val("");
    $("#airline").val("");
    $("#origin").val("");
    $("#destination").val("");
    $("#departureTime").val("");
    $("#arrivalTime").val("");
    $("#duration").val("");
    $("#tripType").val("");
    $("#availableSeats").val("");
    $("#basePrice").val("");
    $("#checkedIn").val("");
    $("#carryOn").val("");
    $("#layoversCount").val("");
    $("#layoverDetails").val("");
    $("#status").val("");
    $(".text-danger").text("");

    $(".form-control").removeClass("is-invalid");
    $(".form-select").removeClass("is-invalid");
}


$(document).ready(function () {


    //load
    applyFilters();
    updateStatistics();

    //search
    $("#searchFlight").on("keyup", applyFilters);


    //apply filter
    $("#airlineFilter").on("change", applyFilters);
    $("#statusFilter").on("change",applyFilters);

    //sort
    $("#sortFlight").on("change",applyFilters);

    //select flight
    $(document).on("click", ".flight-row", function () {

        $(".flight-row").removeClass("selected-row");
        $(this).addClass("selected-row");

        selectedFlightId = $(this).attr("data-id");

        let selectedFlight = filteredFlights.find(
            flight => flight._id === selectedFlightId
        );

        if (!selectedFlight) {
            return;
        }

        selectedFlightIndex = filteredFlights.indexOf(
            selectedFlight
        );

        $("#editBtn").prop("disabled", false);
        $("#deleteBtn").prop("disabled", false);

        $("#selectedFlightLabel").text(
            "Selected: " +
            selectedFlight.flight_number
        );

        console.log("Selected flight ID to delete:", selectedFlightId); // for debuggin
    });

    //add flight
    $("#addBtn").click(function () {

        editMode = false;
        selectedFlightId = null;

        $("#modalTitle").text("Add Flight");

        clearFlightForm();
    });

    //edit flight
    $("#editBtn").click(function () {

        if (selectedFlightIndex < 0) {
            return;
        }

        editMode = true;

        let flight = filteredFlights.find(flight => flight._id === selectedFlightId);
        if(!flight) { return; }

        $("#modalTitle").text("Edit Flight");

        initializeFlight(flight);

        let modal = new bootstrap.Modal(document.getElementById("flightModal"));

        modal.show();
    });


    //save flight
    $("#saveFlight").click(async function () {

        if (!await validateFlightForm()) {
            return;
        }

        const flightData = {

            flight_number: $("#flight_number").val().trim(),
            airline: $("#airline").val(),
            cabinClass: $("#cabinClass").val(),

            origin: $("#origin").val(),
            destination: $("#destination").val(),

            departureTime: new Date($("#departureTime").val()),
            arrivalTime: new Date($("#arrivalTime").val()),

            duration: $("#duration").val(),
            tripType: $("#tripType").val(),

            availableSeats: Number($("#availableSeats").val()),
            basePrice: Number($("#basePrice").val()),

            checkedIn: Number($("#checkedIn").val()),
            carryOn: Number($("#carryOn").val()),

            layoversCount: Number($("#layoversCount").val()),
            layoverDetails: $("#layoverDetails").val(),

            status: $("#status").val()
        };

        console.log("Saving flight:", flightData);

        if (editMode) {

            $.ajax({

                url: `/admin-flights/${selectedFlightId}`,
                type: "PUT",
                contentType: "application/json",
                data: JSON.stringify(flightData),

                success: function (response) {

                    console.log("Flight updated:", response);

                    // Find the edited flight in the local array
                    let index = filteredFlights.findIndex(
                        flight => flight._id === selectedFlightId
                    );

                    if (index !== -1) {

                        // Replace old flight data with updated data
                        filteredFlights[index] = response.flight;
                    }

                    // Close modal
                    bootstrap.Modal
                        .getInstance(document.getElementById("flightModal"))
                        .hide();

                    // Re-render the table
                    renderFlights(filteredFlights);

                    // Update statistics
                    updateStatistics();

                    alert("Flight updated successfully.");
                },

                error: function (xhr) {

                    console.error("Update error:", xhr.responseText);

                    alert("Error updating flight.");
                }
            });

        } else {

            $.ajax({

                url: "/admin-flights",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(flightData),

                success: function (response) {

                    console.log("Flight added:", response);

                    bootstrap.Modal
                        .getInstance(document.getElementById("flightModal"))
                        .hide();

                    applyFilters();
                    updateStatistics();

                    alert("Flight added successfully.");
                },

                error: function (xhr) {

                    console.error("Create error:", xhr.responseText);

                    alert("Error adding flight.");
                }
            });
        }
    });
    //delete
    $("#deleteBtn").click(function () {

        if (selectedFlightId === null) { return; }

        console.log("Selected flight ID to delete:", selectedFlightId); // for debugging


        let modal = new bootstrap.Modal(document.getElementById("deleteModal"));
        modal.show();
    });


    //confirm delete
    $("#confirmDelete").click(function () {

        if(!selectedFlightId) { return; }
        console.log("Deleting flight with MongoDB ID:", selectedFlightId);
        $.ajax({

            url: "/admin-flights/" + selectedFlightId,
            method: "DELETE",

            success: function (response) {
                console.log("Delete response: ", response);

                applyFilters();
                updateStatistics();
                selectedFlightIndex = -1;
                selectedFlightId = null;

                $("#editBtn").prop("disabled", true);
                $("#deleteBtn").prop("disabled",true);
                $("#selectedFlightLabel").text("No flight selected");

                bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
            },

            error: function (error) {
                console.error("Error deleting flight:",error);
                alert("Error deleting flight.");
            }
        });
    });


    //prev page
    $("#previousPage").click(function () {

        if (currentPage > 1) {
            currentPage--;
            renderFlights(filteredFlights);
        }
    });


    //next page
    $("#nextPage").click(function () {

        let totalPages = Math.ceil(filteredFlights.length /rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderFlights(filteredFlights);
        }
    });

});
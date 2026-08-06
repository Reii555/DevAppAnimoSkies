const Flight = require('../models/Flight');

function formatFlights(flights) {
    flights.forEach(flight => {
        flight.departureDate = flight.departureTime.toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila"
        });

        flight.departureTimeFormatted = flight.departureTime.toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "2-digit"
        });

        flight.arrivalDate = flight.arrivalTime.toLocaleDateString("en-PH", {
            timeZone: "Asia/Manila"
        });

        flight.arrivalTimeFormatted = flight.arrivalTime.toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "2-digit"
        });

        if (flight.returnDate) {
            flight.returnDateFormatted = flight.returnDate.toLocaleDateString("en-PH", {
                timeZone: "Asia/Manila"
            });

            flight.returnTimeFormatted = flight.returnDate.toLocaleTimeString("en-PH", {
                timeZone: "Asia/Manila",
                hour: "numeric",
                minute: "2-digit"
            });
        }
        
    });
}

exports.showSearchPage = async (req, res) => {
    try {

        // get all docus of flight collection
        const flights = await Flight.find().lean();

        formatFlights(flights);

        // open the search page with the flights data passed
        res.render('search', {
            title: 'Search Flights',
            flights,
            flightsCount: flights.length
        });

    } catch (err) {
        console.log(err);

        res.render('search', {
            title: 'Search Flights',
            flights: []
        });
    }
};

exports.showFlights = async (req, res) => {
    try {

        // search filter
        const {
            origin,
            destination,
            departureDate,
            returnDate,
            tripType,
            cabinClass,
            airline,
            directFlights,
            minPrice,
            maxPrice,
            stops
        } = req.body;

        const query = {};

        // airports
        if (origin) {
            query.origin = origin;
        }

        if (destination) {
            query.destination = destination;
        }

        // dates
        if (departureDate) {
            const startDate = new Date(`${departureDate}T00:00:00+08:00`);
            const endDate = new Date(`${departureDate}T23:59:59.999+08:00`);

            query.departureTime = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // return-date 
        if (returnDate) {
            const startDate = new Date(`${returnDate}T00:00:00+08:00`);
            const endDate = new Date(`${returnDate}T23:59:59.999+08:00`);

            query.returnDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // trip-type
        if (tripType) {
            query.tripType = tripType;
        }

        // cabin class
        if (cabinClass){
            query.cabinClass = cabinClass;
        }

        // advance search filter
        // preferred airline
        if (airline) {
            query.airline = airline;
        }

        // direct flights only
        if (directFlights) {
            query.layoversCount = 0;
        }

        // price filter
        if (minPrice || maxPrice) {
            query.basePrice = {};

            if (minPrice)
                query.basePrice.$gte = Number(minPrice);

            if (maxPrice)
                query.basePrice.$lte = Number(maxPrice);

        }

        // stops filter
        if (stops) {
            query.layoversCount = Number(stops);
        }

        const flights = await Flight.find(query).lean();

        console.log(req.body); 

        formatFlights(flights);

         res.render("partials/flightCard", {
            layout: false,
            flights
        });
 
    } catch (err) {
        console.log(err);

        res.render("partials/flightCard", {
            layout: false,
            flights: []
        });
    }
}
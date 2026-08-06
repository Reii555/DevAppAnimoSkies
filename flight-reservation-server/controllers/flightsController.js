const Flight = require("../models/Flight");
const AuditLog = require("../models/AuditLog");

// render flights
exports.renderFlights = async (req, res) => {

    try {
        const user = req.session.user;
        const flights = await Flight.find().lean();
        const airlines = await Flight.distinct("airline");

        res.render("admin-flights", {
            title: "Flights",
            layout: "main-admin",
            flights,
            airlines
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading flights");
    }
};


// statistics
exports.getFlightData = async (req, res) => {

    try {
        const flights = await Flight.find();
        res.json(flights);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error loading flight data"
        });
    }
};


// search and filter
exports.searchFlights = async (req, res) => {

    try {
        const {
            search = "",
            airline = "ALL",
            status = "ALL"
        } = req.query;

        let query = {};
        if (search.trim() !== "") {

            query.$or = [
                {
                    flight_number: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    airline: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        if (airline !== "ALL") {
            query.airline = airline;
        }
        if (status !== "ALL") {
            query.status = status;
        }
        const flights = await Flight.find(query);
        res.json(flights);

    } catch (error) {

        console.error(error);
        res.status(500).json({
            error: "Error searching flights"
        });
    }
};


// add flight
exports.addFlight = async (req, res) => {

    const user = req.session.user;

    try {
        const flight = new Flight(req.body);
        await flight.save();

        // AUDIT LOG
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "Flight Creation",
            resource: flight._id.toString(),

            after: {
                flightNumber: flight.flight_number,
                airline: flight.airline,
                origin: flight.origin,
                destination: flight.destination
            }

        });

        res.status(201).json({
            message: "Flight added successfully",
            flight
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            error: error.message
        });
    }
};


// edit flight
exports.updateFlight = async (req, res) => {

    const user = req.session.user;

    try {
        
        const oldFlight = await Flight.findById(req.params.id);

        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // AUDIT LOG
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "Flight Update",
            resource: flight._id.toString(),

            before: {
                flightNumber: oldFlight.flight_number,
                airline: oldFlight.airline,
                origin: oldFlight.origin,
                destination: oldFlight.destination
            },

            after: {
                flightNumber: flight.flightNumber,
                airline: flight.airline,
                origin: flight.origin,
                destination: flight.destination
            }
        });


        if (!flight) {
            return res.status(404).json({
                error: "Flight not found"
            });
        }

        res.json({
            message: "Flight updated successfully",
            flight
        });

    } catch (error) {

        console.error(error);
        res.status(400).json({
            error: error.message
        });
    }
};


// delete flight
exports.deleteFlight = async (req, res) => {

    const user = req.session.user;

    try {

        const flight = await Flight.findById(req.params.id);

        const before = {
            flightNumber: flight.flightNumber,
            origin: flight.origin,
            destination: flight.destination
        };

        await Flight.findByIdAndDelete(
            req.params.id
        );

        // AUDIT LOG
        await AuditLog.create({
            username: user.email,
            role: user.role,
            activity: "Flight Deletion",
            resource: flight._id.toString(),
            before: before,
        });

        if (!flight) {
            return res.status(404).json({
                error: "Flight not found"
            });
        }
        res.json({
            message: "Flight deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error deleting flight"
        });
    }
};


// check duplicate flight number
exports.checkFlightNumber = async (req, res) => {

    try {
        const flightNumber = req.query.flight_number;
        const flightId = req.query.flight_id;

        let query = {
            flight_number: flightNumber
        };

        if (flightId) {
            query._id = {
                $ne: flightId
            };
        }

        const existingFlight = await Flight.findOne(query);
        res.json({
            exists: existingFlight !== null
        });

    } catch (error) {
        console.error("Error checking flight number:", error);
        res.status(500).json({
            error: "Error checking flight number."
        });
    }
};
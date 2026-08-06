const User = require("../models/User");
const Reservation = require("../models/Reservation");
const Flight = require("../models/Flight");
const AuditLog = require('../models/AuditLog');

// render
exports.renderDashboard = async (req, res) => {
    try {

        const user = req.session.user;

        const ongoingFlights = await Flight.countDocuments({
            status: "Ongoing"
        });

        const totalReservations = await Reservation.countDocuments();

        const totalFlights = await Flight.countDocuments();

        // Most booked destinations
        const popularDestinations = await Reservation.aggregate([
            {
                $lookup: {
                    from: "flights",
                    localField: "flightId",
                    foreignField: "_id",
                    as: "flight"
                }
            },
            {
                $unwind: "$flight"
            },
            {
                $group: {
                    _id: "$flight.destination",
                    bookings: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    bookings: -1
                }
            },
            {
                $limit: 5
            }
        ]);

        // Latest reservations
        const recentBookings = await Reservation.find()
            .populate("flightId")
            .populate("passengerId")
            .sort({ booking_date: -1 })
            .limit(5)
            .lean();

        // Latest flights
        const recentFlights = await Flight.find()
            .sort({ departureTime: -1 })
            .limit(5)
            .lean();

        res.render("admin-dashboard", {
            title: "Admin Dashboard",
            layout: "main-admin",
            user,
            activePage: "dashboard",

            ongoingFlights,
            totalReservations,
            totalFlights,
            popularDestinations,
            recentBookings,
            recentFlights
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading admin dashboard");
    }
};

// Revenue
exports.getRevenueData = async (req, res) => {
    try {
        const revenue =
            await Reservation.aggregate([
                {
                    $match: {
                        status: {
                            $in: [
                                "Confirmed",
                                "Completed"
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: {
                                $month: "$booking_date"
                            }
                        },
                        totalRevenue: {
                            $sum: "$total_price"
                        }
                    }
                },
                {
                    $sort: {
                        "_id.month": 1
                    }
                }
            ]);

        const monthlyRevenue = [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ];

        revenue.forEach(function (item) {
            const monthIndex = item._id.month - 1;
            monthlyRevenue[monthIndex] = item.totalRevenue;
        });

        res.json(monthlyRevenue);

    } catch (error) {
        console.error("Error loading revenue data:", error);
        res.status(500).json({
            error: "Error loading revenue data"
        });
    }
};

// Audit Logs
exports.viewAuditLogs = async (req, res) => {

    try {

        const logs = await AuditLog.find().sort({ dateTime: -1 });

        const usernames = await AuditLog.distinct("username");

        res.render('admin-audit', {
            title: 'Audit Logs',
            layout: "main-admin",
            logs,
            usernames
        });

    } catch (error) {

        console.error(error);

        res.status(500).send("Error loading audit logs");

    }

};
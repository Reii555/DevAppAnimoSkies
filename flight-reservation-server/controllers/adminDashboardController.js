const User = require("../models/User");
const Reservation = require("../models/Reservation");
const Flight = require("../models/Flight");
const AuditLog = require('../models/AuditLog');

// render
exports.renderDashboard = async (req, res) => {
    try {
        // statistics
        const ongoingFlights = await Flight.countDocuments({ status: "Ongoing" });
        const totalReservations = await Reservation.countDocuments();
        const totalFlights = await Flight.countDocuments();

        // popular destinations
        const popularDestinations = await Flight.aggregate([
                {
                    $group: {
                        _id: "$destination",
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                },
                {
                    $limit: 5
                }
            ]);

        // recent bookings
        const recentBookings = await Reservation.find().sort({booking_date: -1}).limit(5).lean();
        // recent flights
        const recentFlights = await Flight.find().sort({createdAt: -1}).limit(5).lean();

        res.render("admin-dashboard", {
            title: "Dashboard",
            layout: "main-admin",
            user: req.session.user,
            activePage: "dashboard",
            ongoingFlights,
            totalReservations,
            totalFlights,
            popularDestinations,
            recentBookings,
            recentFlights
        });

    } catch (error) {
        console.error("Error loading admin-dashboard:", error);
        res.status(500).send("Error loading dashboard: " + error.message);
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
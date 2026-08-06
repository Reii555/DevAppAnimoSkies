const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Flight = require("../models/Flight");

describe("Flight Management", () => {
    let agent;
    let adminUser;
    let flight;

    beforeEach(async () => {
        await User.deleteMany({});
        await Flight.deleteMany({});

        agent = request.agent(app);

        adminUser = await User.create({
            email: "admin@test.com",
            phone: "09205612160",
            password: "adminpassword",
            role: "admin",
            status: "active"
        });

        await agent.post("/login").send({
            email: "admin@test.com",
            password: "adminpassword"
        });

        flight = await Flight.create({
            flight_number: "PR1004",
            airline: "Philippine Airlines",
            cabinClass: "Economy",
            origin: "MNL",
            destination: "CEB",
            departureTime: new Date(),
            arrivalTime: new Date(Date.now() + 7200000),
            duration: "2hrs",
            tripType: "One-way",
            layoversCount: 0,
            layoverDetails: "Direct",
            checkedIn: 20,
            carryOn: 7,
            basePrice: 5000,
            availableSeats: 40,
            status: "Upcoming"
        });
    });

    afterAll(async() => {
        await mongoose.connection.close();
    });

    //create flight
    test("Create Flight", async () => {
        const res = await agent.post("/admin-flights").send({
            flight_number: "AS1005",
            airline: "AirAsia",
            cabinClass: "Economy",
            origin: "MNL",
            destination: "DVO",
            departureTime: new Date(),
            arrivalTime: new Date(Date.now() + 7200000),
            duration: "2hrs",
            tripType: "One-way",
            layoversCount: 0,
            layoverDetails: "Direct",
            checkedIn: 20,
            carryOn: 7,
            basePrice: 2500,
            availableSeats: 40,
            status: "Delayed"
        });

        expect(res.statusCode).toBe(201);

        const created = await Flight.findOne({ flight_number: "AS1005" });
        expect(created).not.toBeNull();
    });

    //update flight
    test("Update Flight", async() => {
        const res = await agent.put(`/admin-flights/${flight._id}`).send({
            airline: "Philippine Airlines",
            basePrice: 5500,
            status: "Cancelled"
        });
        expect(res.statusCode).toBe(200);

        const updated = await Flight.findById(flight._id);
        expect(updated.airline).toBe("Philippine Airlines");
        expect(updated.basePrice).toBe(5500);
        expect(updated.status).toBe("Cancelled");
    });

    //delete flight
    test("Delete Flight", async() => {
        const res = await agent.delete(`/admin-flights/${flight._id}`);
        expect(res.statusCode).toBe(200);

        const deleted = await Flight.findById(flight._id);
        expect(deleted).toBeNull();
    })
});
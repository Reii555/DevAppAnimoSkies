const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = require("../server");
const User = require("../models/User");
const Passenger = require("../models/Passenger");
const Flight = require("../models/Flight");
const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");
const Test = require("supertest/lib/test");

describe("Business rule Validation", () => {
    let agent;
    let user;
    let passenger;
    let flight;

    beforeEach(async()=>{
        await Promise.all([
            User.deleteMany({}),
            Passenger.deleteMany({}),
            Flight.deleteMany({}),
            Reservation.deleteMany({}),
            Seat.deleteMany({})
        ]);

        agent = request.agent(app);

        user = await User.create({
            email:"business@test.com",
            phone: "09190726704",
            password: "password123",
            role: "passenger",
            status: "active"
        });

        const login = await agent
            .post("/login")
            .type("form")
            .send({
                email: "business@test.com",
                password: "password123"
            });

        console.log("Login Status:", login.status);
        console.log("Login Redirect:", login.headers.location);
        console.log("Login Body:", login.text);

        passenger = await Passenger.create({
            user_id:user._id,
            full_name:"Mr. Business Test",
            email: "business@test.com",
            contact_num: "09190726704",
            passport_num: "P123456",
            nationality: "Filipino",
            birth_date: new Date("2001-09-10"),
            gender: "Male",
            emergency_contact: "09190726707"
        });

        flight = await Flight.create({
            flight_number: "BR1000",
            airline: "Cebu Pacific",
            cabinClass: "Economy",
            origin: "MNL",
            destination: "CEB",
            departureTime: new Date(),
            arrivalTime : new Date(Date.now() + 7200000),
            duration: "2hrs",
            tripType: "One-way",
            layoversCount:0,
            layoverDetails: "Direct",
            checkedIn: 0,
            carryOn: 0,
            basePrice: 2000,
            availableSeats: 5,
            status: "Ongoing"
        });

        await Seat.create({
            flight_id:flight._id,
            seatNumber:"1A",
            status: "Unoccupied"
        });
    });

    afterAll(async()=> {
        await mongoose.connection.close();
    });

    //successful business rule
    test("This should allow booking an available seat", async() => {
        const res = await agent.post("/booking/reserve").send({
            passengerId: passenger._id,
            flightId: flight._id,
            seatNumber: "1A",
            mealPreference: "Standard",
            mealPrice: 0,
            extraServices: {},
            extraServicesPrice: 0,
            booking_ref: "BR_SUCCESS",
            total_price:2000
        });

        expect(res.status).toBe(200);

        const reservation = await Reservation.findOne({ booking_ref: "BR_SUCCESS" });
        expect(reservation).not.toBeNull();

        const seat = await Seat.findOne({ seatNumber: "1A" });
        expect(seat.status).toBe("Occupied");
    });

    //failed business rule
    test("Should prevent user in booking an occupied seat", async()=>{
        //first reservation occupies seat
        await Reservation.create({
            userId:user._id,
            passengerId: passenger._id,
            flightId:flight._id,
            seatNumber:"1A",
            booking_ref:"OCCUPIED",
            status: "Confirmed",
            total_price: 2000
        });

        await Seat.findOneAndUpdate(
            {
                flight_id: flight._id,
                seatNumber:"1A"
            },
            {
                status: "Occupied"
            }
        );

        const res = await agent.post("/booking/reserve").send({
            passengerId: passenger._id,
            flightId: flight._id,
            seatNumber: "1A",
            mealPreference: "Standard",
            mealPrice: 0,
            extraServices:{},
            extraServicesPrice:0,
            booking_ref:"BR_FAILED",
            total_price: 2000
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });
});
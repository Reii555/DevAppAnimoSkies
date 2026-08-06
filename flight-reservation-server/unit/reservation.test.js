const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = require("../server");

const User = require("../models/User");
const Passenger = require("../models/Passenger");
const Flight = require("../models/Flight");
const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");


describe("Reservation Management", () => {

    let agent;
    let user;
    let passenger;
    let flight;


    beforeEach(async () => {

        await Promise.all([
            User.deleteMany({}),
            Passenger.deleteMany({}),
            Flight.deleteMany({}),
            Reservation.deleteMany({}),
            Seat.deleteMany({})
        ]);


        agent = request.agent(app);


        const hashedPassword = await bcrypt.hash(
            "password123",
            10
        );


        user = await User.create({
            email: "passenger@test.com",
            phone: "09123456789",
            password: hashedPassword,
            role: "passenger",
            status: "active"
        });


        const login = await agent
            .post("/login")
            .type("form")
            .send({
                email: "passenger@test.com",
                password: "password123"
            });


        console.log("LOGIN STATUS:", login.status);


        expect([200,302]).toContain(login.status);



        passenger = await Passenger.create({

            user_id: user._id,
            full_name: "John Kennedy",
            contact_num: "09123456789",
            passport_num: "P1234567",
            nationality: "Filipino",
            birth_date: new Date("1991-01-01"),
            gender: "Male",
            emergency_contact: "Jane"

        });



        flight = await Flight.create({

            flight_number: "AS5555",
            airline: "Cebu Pacific",
            cabinClass: "Premium Economy",

            origin: "MNL",
            destination: "CEB",

            departureTime: new Date(),
            arrivalTime: new Date(Date.now()+7200000),

            duration:"2hrs",
            tripType:"One-way",

            layoversCount:0,
            layoverDetails:"Direct",

            checkedIn:20,
            carryOn:5,

            basePrice:2300,
            availableSeats:30,

            status:"Ongoing"

        });



        await Seat.create({

            flight_id: flight._id,
            seatNumber:"1A",
            status:"Unoccupied"

        });

        await new Promise(resolve => setTimeout(resolve, 1000));

    });



    afterAll(async()=>{
        await mongoose.connection.close();
    });



    test("Create Reservation", async()=>{


        const res = await agent
            .post("/booking/reserve")
            .send({

                passengerId: passenger._id.toString(),

                flightId: flight._id.toString(),

                seatNumber:"1A",

                mealPreference:"Standard",

                mealPrice:0,

                extraServices:{},

                extraServicesPrice:0,

                booking_ref:"BKTEST01",

                total_price:3000

            });



        console.log(
            "CREATE STATUS:",
            res.status
        );

        console.log(
            "CREATE BODY:",
            res.body
        );


        expect(res.status).toBe(200);



        const reservation =
            await Reservation.findOne({
                booking_ref:"BKTEST01"
            });



        expect(reservation)
            .not
            .toBeNull();



        expect(reservation.status)
            .toBe("Confirmed");



        const seat =
            await Seat.findOne({

                flight_id:flight._id,

                seatNumber:"1A"

            });



        expect(seat.status)
            .toBe("Occupied");


    });



    test("Cancel Reservation", async()=>{


        await Seat.findOneAndUpdate(

            {
                flight_id:flight._id,
                seatNumber:"1A"
            },

            {
                status:"Occupied"
            }

        );



        const reservation =
            await Reservation.create({

                userId:user._id,

                passengerId:passenger._id,

                flightId:flight._id,

                seatNumber:"1A",

                booking_ref:"BKTEST01",

                status:"Confirmed",

                total_price:3000

            });



        const res =
            await agent
            .patch(
                `/reservations/${reservation._id}/cancel`
            );



        console.log(
            "CANCEL STATUS:",
            res.status
        );

        console.log(
            "CANCEL BODY:",
            res.body
        );



        expect(res.status)
            .toBe(200);



        const updatedReservation =
            await Reservation.findById(
                reservation._id
            );



        expect(updatedReservation.status)
            .toBe("Cancelled");



        const updatedSeat =
            await Seat.findOne({

                flight_id:flight._id,

                seatNumber:"1A"

            });



        expect(updatedSeat.status)
            .toBe("Unoccupied");


    });


});
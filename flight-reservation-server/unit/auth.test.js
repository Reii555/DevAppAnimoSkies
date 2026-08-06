const request = require("supertest");
const app = require("../server");
const User = require("../models/User");

describe("Authentication", () => {

    beforeEach(async () => {
        await User.deleteMany({});
    });

    test("Successful Registration", async () => {

        const res = await request(app)
            .post("/register")
            .send({
                email: "test@test.com",
                phone: "09123456789",
                password: "password123",
                confirmPassword: "password123"
            });

        expect(res.statusCode).toBe(200);

        const savedUser = await User.findOne({
            email: "test@test.com"
        });

        expect(savedUser).not.toBeNull();
        expect(savedUser.email).toBe("test@test.com");
    });

    test("Successful Login", async () => {

        await User.create({
            email: "user@test.com",
            phone: "09205612160",
            password: "password123",
            role: "passenger"
        });

        const res = await request(app)
            .post("/login")
            .send({
                email: "user@test.com",
                password: "password123"
            });

        expect(res.statusCode).toBe(302);
    });

    test("Failed Login", async () => {

        const res = await request(app)
            .post("/login")
            .send({
                email: "wrong@test.com",
                password: "wrongpassword"
            });

        // Change this to 200 if your login route renders the page instead of sending 401
        expect([200, 401]).toContain(res.statusCode);
    });

});
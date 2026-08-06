const request = require("supertest");
const app = require("../server");

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

<<<<<<< HEAD
// mock audit log so it doesn't affect authentication tests
=======
//mock audit log so it doesn't affect authentication tests
>>>>>>> 202697c140a1bfba50e61d5e7ea12bbb3c4b0eb1
jest.spyOn(AuditLog, "create").mockResolvedValue({});

describe("Authentication", () => {

    beforeEach(async () => {
        await User.deleteMany({});
        jest.clearAllMocks();
    });

    // successful registration
    test("Successful Registration", async () => {

        const res = await request(app).post("/signup").send({
                email: "test@test.com",
                phone: "09123456789",
                password: "password123",
                confirmPassword: "password123"
            });

        // registration renders the login page
        expect(res.statusCode).toBe(200);

        const savedUser = await User.findOne({
            email: "test@test.com"
        });

        expect(savedUser).not.toBeNull();
        expect(savedUser.email).toBe("test@test.com");
        expect(savedUser.role).toBe("passenger");

        expect(AuditLog.create).toHaveBeenCalled();
    });

    // successful login
    test("Successful Login", async () => {

        await User.create({
            email: "user@test.com",
            phone: "09123456789",
            password: "password123",
            role: "passenger",
            status: "active"
        });

        const res = await request(app).post("/login").send({
                email: "user@test.com",
                password: "password123"
            });

        expect(res.statusCode).toBe(302);
    });

    // failed login
    test("Failed Login", async () => {

        const res = await request(app).post("/login").send({
                email: "wrong@test.com",
                password: "wrongpassword"
            });

        expect([200, 401]).toContain(res.statusCode);
    });

});
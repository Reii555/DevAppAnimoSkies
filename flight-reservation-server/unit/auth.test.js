const request = require("supertest");
const app = require("../server");

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Mock audit log so it doesn't affect authentication tests
jest.spyOn(AuditLog, "create").mockResolvedValue({});

describe("Authentication", () => {

    beforeEach(async () => {
        await User.deleteMany({});
        jest.clearAllMocks();
    });

    // Successful Registration
    test("Successful Registration", async () => {

        const res = await request(app).post("/signup").send({
                email: "test@test.com",
                phone: "09123456789",
                password: "password123",
                confirmPassword: "password123"
            });

        // Registration renders the login page
        expect(res.statusCode).toBe(200);

        const savedUser = await User.findOne({
            email: "test@test.com"
        });

        expect(savedUser).not.toBeNull();
        expect(savedUser.email).toBe("test@test.com");
        expect(savedUser.role).toBe("passenger");

        expect(AuditLog.create).toHaveBeenCalled();
    });

    // Successful Login
    test("Successful Login", async () => {

        await User.create({
            email: "user@test.com",
            phone: "09123456789",
            password: "password123",
            role: "passenger",
            status: "active"
        });

        const res = await request(app)
            .post("/login")
            .send({
                email: "user@test.com",
                password: "password123"
            });

        expect(res.statusCode).toBe(302);
    });

    // Failed Login
    test("Failed Login", async () => {

        const res = await request(app)
            .post("/login")
            .send({
                email: "wrong@test.com",
                password: "wrongpassword"
            });

        expect([200, 401]).toContain(res.statusCode);
    });

});
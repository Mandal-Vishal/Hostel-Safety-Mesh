const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

const protect = require("./auth.middleware");

jest.mock("jsonwebtoken");

jest.mock("../models/user.model", () => ({
  findById: jest.fn(),
}));

describe("Auth Middleware", () => {
  let req;
  let res;
  let next;

  const mockUser = {
    _id: "user-123",
    role: "resident",
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),

      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  test("rejects request when Authorization header is missing", async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required",
    });

    expect(next).not.toHaveBeenCalled();

    expect(jwt.verify).not.toHaveBeenCalled();

    expect(User.findById).not.toHaveBeenCalled();
  });

  test("rejects request when Authorization header does not use Bearer scheme", async () => {
    req.headers.authorization = "Basic some-token";

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required",
    });

    expect(next).not.toHaveBeenCalled();

    expect(jwt.verify).not.toHaveBeenCalled();
  });

  test("rejects request when Bearer token is missing", async () => {
    req.headers.authorization = "Bearer ";

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects invalid JWT", async () => {
    req.headers.authorization = "Bearer invalid-token";

    jwt.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("invalid-token", "test-secret");

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token",
    });

    expect(next).not.toHaveBeenCalled();

    expect(User.findById).not.toHaveBeenCalled();
  });

  test("rejects expired JWT", async () => {
    req.headers.authorization = "Bearer expired-token";

    jwt.verify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid or expired token",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects token without userId", async () => {
    req.headers.authorization = "Bearer token-without-user";

    jwt.verify.mockReturnValue({
      role: "resident",
    });

    /**
     * Current middleware passes decoded.userId
     * to findById. Undefined means no matching
     * user should be accepted.
     */
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "token-without-user",
      "test-secret",
    );

    expect(User.findById).toHaveBeenCalledWith(undefined);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found or inactive",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects token when user does not exist", async () => {
    req.headers.authorization = "Bearer valid-token";

    jwt.verify.mockReturnValue({
      userId: "missing-user",
      role: "resident",
    });

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith("missing-user");

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found or inactive",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects inactive user", async () => {
    req.headers.authorization = "Bearer inactive-user-token";

    jwt.verify.mockReturnValue({
      userId: "inactive-user",
      role: "resident",
    });

    const inactiveUser = {
      ...mockUser,
      _id: "inactive-user",
      isActive: false,
    };

    const select = jest.fn().mockResolvedValue(inactiveUser);

    User.findById.mockReturnValue({
      select,
    });

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith("inactive-user");

    expect(select).toHaveBeenCalledWith("-passwordHash");

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found or inactive",
    });

    expect(next).not.toHaveBeenCalled();

    expect(req.user).toBeUndefined();
  });

  test("loads user without passwordHash", async () => {
    req.headers.authorization = "Bearer valid-token";

    jwt.verify.mockReturnValue({
      userId: "user-123",
      role: "resident",
    });

    const user = {
      ...mockUser,

      /**
       * Included in the mock to prove the middleware
       * explicitly excludes it from the database query.
       */
      passwordHash: "super-secret-password-hash",
    };

    const select = jest.fn().mockResolvedValue(user);

    User.findById.mockReturnValue({
      select,
    });

    await protect(req, res, next);

    expect(User.findById).toHaveBeenCalledWith("user-123");

    expect(select).toHaveBeenCalledWith("-passwordHash");

    expect(req.user).toBe(user);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });

  test("accepts valid active user", async () => {
    req.headers.authorization = "Bearer valid-token";

    jwt.verify.mockReturnValue({
      userId: "user-123",
      role: "resident",
    });

    const select = jest.fn().mockResolvedValue(mockUser);

    User.findById.mockReturnValue({
      select,
    });

    await protect(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");

    expect(User.findById).toHaveBeenCalledWith("user-123");

    expect(select).toHaveBeenCalledWith("-passwordHash");

    expect(req.user).toBe(mockUser);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });

  test("uses database user rather than trusting JWT role", async () => {
    req.headers.authorization = "Bearer role-mismatch-token";

    /**
     * JWT claims say resident.
     */
    jwt.verify.mockReturnValue({
      userId: "user-123",
      role: "resident",
    });

    /**
     * Database says warden.
     *
     * The middleware should attach the database
     * user object to req.user.
     */
    const databaseUser = {
      _id: "user-123",
      role: "warden",
      isActive: true,
    };

    const select = jest.fn().mockResolvedValue(databaseUser);

    User.findById.mockReturnValue({
      select,
    });

    await protect(req, res, next);

    expect(req.user).toBe(databaseUser);

    expect(req.user.role).toBe("warden");

    expect(next).toHaveBeenCalledTimes(1);
  });
});

const authorize = require("./role.middleware");

describe("Role Authorization Middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  test("rejects unauthenticated request", () => {
    const middleware = authorize("warden");

    req.user = null;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication required",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("allows user with permitted role", () => {
    const middleware = authorize("warden");

    req.user = {
      _id: "warden-123",
      role: "warden",
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });

  test("rejects user with non-permitted role", () => {
    const middleware = authorize("warden");

    req.user = {
      _id: "resident-123",
      role: "resident",
    };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("allows security role when explicitly permitted", () => {
    const middleware = authorize("warden", "security");

    req.user = {
      _id: "security-123",
      role: "security",
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });

  test("allows resident role when explicitly permitted", () => {
    const middleware = authorize("resident");

    req.user = {
      _id: "resident-123",
      role: "resident",
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).not.toHaveBeenCalled();
  });

  test("supports multiple allowed roles", () => {
    const middleware = authorize("warden", "security");

    req.user = {
      _id: "warden-123",
      role: "warden",
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    req.user = {
      _id: "security-123",
      role: "security",
    };

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("rejects resident from warden/security-only middleware", () => {
    const middleware = authorize("warden", "security");

    req.user = {
      _id: "resident-123",
      role: "resident",
    };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects warden from resident-only middleware", () => {
    const middleware = authorize("resident");

    req.user = {
      _id: "warden-123",
      role: "warden",
    };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects security from resident-only middleware", () => {
    const middleware = authorize("resident");

    req.user = {
      _id: "security-123",
      role: "security",
    };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });

    expect(next).not.toHaveBeenCalled();
  });

  test("rejects unknown role", () => {
    const middleware = authorize("warden", "security");

    req.user = {
      _id: "unknown-123",
      role: "admin",
    };

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied",
    });

    expect(next).not.toHaveBeenCalled();
  });
});

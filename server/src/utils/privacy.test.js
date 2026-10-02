const {
  sanitizeUser,
  sanitizeUserForSecurity,
  sanitizeUserForWarden,
  sanitizeIncident,
  sanitizeCheckIn,
} = require("./privacy");

describe("Privacy Layer", () => {
  const user = {
    _id: "user-123",
    firstName: "Vishal",
    lastName: "Mandal",
    email: "student@example.com",
    role: "resident",
    hostel: "Hostel-A",
    currentZone: "Zone-1",
    passwordHash: "SECRET_HASH",
  };

  test("never exposes password hash", () => {
    const result = sanitizeUser(user, {
      includeEmail: true,
      includeLocation: true,
    });

    expect(result.passwordHash).toBeUndefined();
  });

  test("resident projection does not expose email", () => {
    const result = sanitizeUserForSecurity(user);

    expect(result.email).toBeUndefined();
  });

  test("warden projection may contain operational email", () => {
    const result = sanitizeUserForWarden(user);

    expect(result.email).toBe("student@example.com");
  });

  test("security projection can contain operational location", () => {
    const result = sanitizeUserForSecurity(user);

    expect(result.currentZone).toBe("Zone-1");
  });

  test("incident projection does not expose unnecessary fields", () => {
    const incident = {
      _id: "incident-123",
      type: "SOS",
      category: "EMERGENCY",
      status: "ACTIVE",
      createdAt: new Date(),
      residentId: user,

      secretInternalField: "PRIVATE",
      internalToken: "SECRET",
    };

    const result = sanitizeIncident(
      incident,
      "security"
    );

    expect(result.internalToken).toBeUndefined();
    expect(result.secretInternalField).toBeUndefined();
  });

  test("check-in exposes zone only to operational roles", () => {
    const checkIn = {
      _id: "checkin-123",
      status: "CHECKED_IN",
      scheduledAt: new Date(),
      checkedInAt: new Date(),
      source: "APP",
      zone: "Zone-1",
      residentId: user,
    };

    const residentResult = sanitizeCheckIn(
      checkIn,
      "resident"
    );

    expect(residentResult.zone).toBeUndefined();

    const securityResult = sanitizeCheckIn(
      checkIn,
      "security"
    );

    expect(securityResult.zone).toBe("Zone-1");
  });
});
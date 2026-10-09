import api from "./api";

function getErrorMessage(error, fallback) {
  if (error.response) {
    const message = error.response.data?.message;

    if (message) return message;

    return `API request failed with HTTP ${error.response.status}.`;
  }

  if (error.request) {
    return `No response from backend at ${
      api.defaults.baseURL
    }. Check that the server is running and CORS is configured correctly.`;
  }

  return error.message || fallback;
}

export async function getResidents() {
  try {
    const response = await api.get("/users/residents");
    const residents = response.data?.residents;

    if (!Array.isArray(residents)) {
      throw new Error(
        "Unexpected response from the residents API."
      );
    }

    // MongoDB returns _id; the UI uses id.
    return residents.map((resident) => ({
      ...resident,
      id: resident.id || resident._id,
    }));
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to load residents.")
    );
  }
}

export async function createResident(residentData) {
  try {
    const response = await api.post(
      "/users/residents",
      residentData
    );

    return response.data?.resident;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to create resident.")
    );
  }
}
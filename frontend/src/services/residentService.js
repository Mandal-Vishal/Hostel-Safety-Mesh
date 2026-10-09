import api from "./api";

export async function getResidents() {
  const response = await api.get("/users/residents");
  return response.data;
}

export async function createResident(residentData) {
  const response = await api.post("/users/residents", residentData);
  return response.data;
}

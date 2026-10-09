import api from "./api";

export async function getResidents() {
  const res = await api.get(
    "/users/residents"
  );

  return res.data.residents || [];
}

export async function createResident(data) {
  const res = await api.post(
    "/users/residents",
    data
  );

  return res.data.resident;
}
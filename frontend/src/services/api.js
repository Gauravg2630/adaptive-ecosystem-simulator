export const API_URL = "http://localhost:5000/api";

export const saveSimulationSnapshot = async (snapshot) => {
  try {
    const res = await fetch(`${API_URL}/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    return res.json();
  } catch (error) {
    console.error("Error saving snapshot:", error);
  }
};

export const getSimulationSnapshots = async () => {
  try {
    const res = await fetch(`${API_URL}/simulation`);
    return res.json();
  } catch (error) {
    console.error("Error fetching snapshots:", error);
  }
};

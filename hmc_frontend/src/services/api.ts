// src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // <-- THIS MUST BE 5000, NOT 5027
});

export default api;queueMicrotask
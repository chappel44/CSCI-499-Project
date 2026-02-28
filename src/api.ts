import axios from "axios";

const api = axios.create({
  baseURL: "/api", // backend URL
  withCredentials: false,
});

export default api;

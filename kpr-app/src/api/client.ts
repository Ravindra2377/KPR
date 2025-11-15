import axios from "axios";

export const BASE_URL = "http://10.0.2.2:5000"; // change to localhost or ngrok as needed

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000
});

export default api;

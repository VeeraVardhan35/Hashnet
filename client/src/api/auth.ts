import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:2567/api",
    headers: {
        "Content-Type": "application/json",
    },
});
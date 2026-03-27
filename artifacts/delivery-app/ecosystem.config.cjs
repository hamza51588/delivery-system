module.exports = {
  apps : [{
    name   : "Order-Frontend",
    script : "pnpm",
    args   : "run dev --host 0.0.0.0",
    env: {
      PORT: 5173,
      BASE_PATH: "/",
      VITE_API_URL: "http://10.56.43.7:5000/api"
    }
  }]
}

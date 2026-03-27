module.exports = {
  apps : [{
    name   : "Order-Backend",
    script : "dist/index.mjs",
    env: {
      PORT: 5000,
      DATABASE_URL: "postgresql://postgres:1234@localhost:5432/delivery_system"
    }
  }]
}

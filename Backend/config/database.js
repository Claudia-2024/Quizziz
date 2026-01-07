import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "quizziz_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "claudia@2603",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3308,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false,
  }
);

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default sequelize;

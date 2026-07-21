require("dotenv").config(); // This loads your .env file!

module.exports = {
  development: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // This is needed for some environments
      },
    },
  },
};

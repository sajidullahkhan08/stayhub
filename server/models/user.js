module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true },
      password: DataTypes.STRING,
      role: {
        type: DataTypes.ENUM("admin", "owner", "customer"),
        defaultValue: "customer",
      },
    },
    {},
  );

  User.associate = function (models) {
    User.hasMany(models.Hotel, { foreignKey: "ownerId", as: "hotels" });
    User.hasMany(models.Booking, { foreignKey: "userId", as: "bookings" });
  };
  return User;
};

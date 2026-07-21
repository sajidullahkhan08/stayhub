module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define(
    "Hotel",
    {
      name: DataTypes.STRING,
      city: DataTypes.STRING,
      description: DataTypes.TEXT,
      ownerId: { type: DataTypes.INTEGER, allowNull: true }, // allowNull true for easy testing
    },
    {},
  );

  Hotel.associate = function (models) {
    Hotel.belongsTo(models.User, { foreignKey: "ownerId", as: "owner" });
    Hotel.hasMany(models.Room, { foreignKey: "hotelId", as: "rooms" });
  };
  return Hotel;
};

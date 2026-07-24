"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Name is required",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Email address already in use",
        },
        validate: {
          isEmail: {
            msg: "Must be a valid email address",
          },
          notEmpty: {
            msg: "Email is required",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password is required",
          },
        },
      },
      role: {
        type: DataTypes.ENUM("admin", "hotel_owner", "customer"),
        allowNull: false,
        defaultValue: "customer",
      },
      isBanned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: {
          attributes: [
            "id",
            "name",
            "email",
            "password",
            "role",
            "isBanned",
            "createdAt",
            "updatedAt",
          ],
        },
      },
    },
  );

  User.associate = function (models) {
    User.hasMany(models.Hotel, { foreignKey: "ownerId", as: "hotels" });
    User.hasMany(models.Booking, { foreignKey: "userId", as: "bookings" });
  };

  return User;
};

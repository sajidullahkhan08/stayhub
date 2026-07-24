"use strict";

const db = require("../models");

/**
 * GET /api/admin/users
 * Requires admin. Returns all users without passwords.
 */
async function getAllUsers(req, res) {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Requires admin. Deletes a user by ID.
 */
async function deleteUser(req, res) {
  try {
    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: { id: user.id, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  deleteUser,
};

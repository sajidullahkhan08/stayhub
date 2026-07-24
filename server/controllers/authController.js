"use strict";

const db = require("../models");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");
const { generateToken } = require("../utils/tokenUtils");

/**
 * Strip password from a user instance / plain object before sending in a response.
 */
function sanitizeUser(user) {
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.password;
  return plain;
}

/**
 * POST /api/auth/register
 * Register a new user, hash password, return JWT + user (no password).
 */
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await db.User.unscoped().findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
      isBanned: false,
    });

    const token = await generateToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate with email/password. Generic 401 message to prevent enumeration.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await db.User.scope("withPassword").findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned. Please contact support.",
      });
    }

    const token = await generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
};

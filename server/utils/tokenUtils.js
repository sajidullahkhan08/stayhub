"use strict";

const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for the given user.
 * Payload contains only id and role (never the password).
 * @param {{ id: number, role: string }} user
 * @returns {Promise<string>} Signed JWT
 */
async function generateToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = {
  generateToken,
};

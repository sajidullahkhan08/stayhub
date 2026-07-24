"use strict";

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password using bcrypt.
 * @param {string} plain - The plain-text password
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param {string} plain - The plain-text password
 * @param {string} hashed - The stored bcrypt hash
 * @returns {Promise<boolean>} True if the password matches
 */
async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = {
  hashPassword,
  comparePassword,
};

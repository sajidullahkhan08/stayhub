"use strict";

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizeMiddleware");

router.get(
  "/users",
  authenticate,
  authorize("admin"),
  adminController.getAllUsers,
);

router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  adminController.deleteUser,
);

module.exports = router;

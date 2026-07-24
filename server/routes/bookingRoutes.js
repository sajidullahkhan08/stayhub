"use strict";

const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizeMiddleware");

router.post(
  "/",
  authenticate,
  authorize("customer"),
  bookingController.createBooking,
);

router.get(
  "/my-bookings",
  authenticate,
  authorize("customer"),
  bookingController.getMyBookings,
);

module.exports = router;

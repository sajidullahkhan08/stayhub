"use strict";

const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorizeMiddleware");

router.get("/", hotelController.getAllHotels);

router.post(
  "/",
  authenticate,
  authorize("hotel_owner", "admin"),
  hotelController.createHotel,
);

router.put(
  "/:id",
  authenticate,
  authorize("hotel_owner", "admin"),
  hotelController.updateHotel,
);

router.delete(
  "/:id",
  authenticate,
  authorize("hotel_owner", "admin"),
  hotelController.deleteHotel,
);

module.exports = router;

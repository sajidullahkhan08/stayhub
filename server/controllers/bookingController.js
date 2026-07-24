"use strict";

const db = require("../models");

/**
 * POST /api/bookings
 * Requires customer. Creates a booking owned by the authenticated user.
 */
async function createBooking(req, res) {
  try {
    const { checkIn, checkOut, roomId } = req.body;

    if (!checkIn || !checkOut || !roomId) {
      return res.status(400).json({
        success: false,
        message: "Please provide checkIn, checkOut, and roomId",
      });
    }

    const room = await db.Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const booking = await db.Booking.create({
      checkIn,
      checkOut,
      roomId,
      userId: req.user.id,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    });
  }
}

/**
 * GET /api/bookings/my-bookings
 * Requires customer. Returns only bookings belonging to the authenticated user.
 */
async function getMyBookings(req, res) {
  try {
    const bookings = await db.Booking.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.Room,
          as: "room",
          include: [{ model: db.Hotel, as: "hotel" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
}

module.exports = {
  createBooking,
  getMyBookings,
};

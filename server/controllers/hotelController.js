"use strict";

const db = require("../models");

/**
 * GET /api/hotels
 * Public — return all hotels with their rooms.
 */
async function getAllHotels(req, res) {
  try {
    const hotels = await db.Hotel.findAll({
      include: [{ model: db.Room, as: "rooms" }],
    });

    return res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotels",
      error: error.message,
    });
  }
}

/**
 * POST /api/hotels
 * Requires hotel_owner or admin. Sets ownerId from authenticated user.
 */
async function createHotel(req, res) {
  try {
    const { name, city, description } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and city",
      });
    }

    const hotel = await db.Hotel.create({
      name,
      city,
      description,
      ownerId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create hotel",
      error: error.message,
    });
  }
}

/**
 * PUT /api/hotels/:id
 * Requires hotel_owner or admin.
 * hotel_owner may only update hotels they own; admin bypasses ownership check.
 */
async function updateHotel(req, res) {
  try {
    const hotel = await db.Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (
      req.user.role === "hotel_owner" &&
      hotel.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You can only update hotels that you own.",
      });
    }

    const { name, city, description } = req.body;

    await hotel.update({
      name: name !== undefined ? name : hotel.name,
      city: city !== undefined ? city : hotel.city,
      description: description !== undefined ? description : hotel.description,
    });

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update hotel",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/hotels/:id
 * Requires hotel_owner or admin.
 * hotel_owner may only delete hotels they own; admin bypasses ownership check.
 */
async function deleteHotel(req, res) {
  try {
    const hotel = await db.Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (
      req.user.role === "hotel_owner" &&
      hotel.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You can only delete hotels that you own.",
      });
    }

    await hotel.destroy();

    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
      data: hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete hotel",
      error: error.message,
    });
  }
}

module.exports = {
  getAllHotels,
  createHotel,
  updateHotel,
  deleteHotel,
};

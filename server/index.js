require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./models"); // Imports all models and the sequelize instance

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// HOTEL ROUTES (Database-Backed CRUD)
// ==========================================

// 1. GET ALL HOTELS (Includes associated Rooms)
app.get("/api/hotels", async (req, res) => {
  try {
    const hotels = await db.Hotel.findAll({
      include: [{ model: db.Room, as: "rooms" }],
    });
    res.status(200).json({ success: true, count: hotels.length, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET SINGLE HOTEL BY ID
app.get("/api/hotels/:id", async (req, res) => {
  try {
    const hotel = await db.Hotel.findByPk(req.params.id, {
      include: [{ model: db.Room, as: "rooms" }],
    });

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    res.status(200).json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CREATE NEW HOTEL
app.post("/api/hotels", async (req, res) => {
  try {
    const { name, city, description, ownerId } = req.body;

    if (!name || !city) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide name and city" });
    }

    const newHotel = await db.Hotel.create({
      name,
      city,
      description,
      ownerId,
    });

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: newHotel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TEMPORARY: Create a test user
app.post("/api/test-user", async (req, res) => {
  try {
    const newUser = await db.User.create({
      name: "Test Owner",
      email: "owner@stayhub.com",
      password: "password123", // In production, we will hash this with bcrypt!
      role: "owner",
    });
    res
      .status(201)
      .json({ success: true, message: "User created", data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. UPDATE HOTEL
app.put("/api/hotels/:id", async (req, res) => {
  try {
    const hotel = await db.Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    const { name, city, description, ownerId } = req.body;

    await hotel.update({
      name: name || hotel.name,
      city: city || hotel.city,
      description: description || hotel.description,
      ownerId: ownerId !== undefined ? ownerId : hotel.ownerId,
    });

    res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: hotel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. DELETE HOTEL
app.delete("/api/hotels/:id", async (req, res) => {
  try {
    const hotel = await db.Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res
        .status(404)
        .json({ success: false, message: "Hotel not found" });
    }

    await hotel.destroy();

    res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
      data: hotel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// SERVER START & DB CONNECTION CHECK
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();

    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Database (Supabase) connected successfully!`);
  } catch (error) {
    console.error(`❌ Unable to connect to the database:`, error);
  }
});

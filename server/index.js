require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Crucial for parsing JSON bodies in POST/PUT

// ==========================================
// IN-MEMORY "DATABASE"
// ==========================================
let hotels = [
  {
    id: 1,
    name: "The Grand Teerop",
    location: "New York",
    pricePerNight: 250,
    ownerId: 101,
  },
  {
    id: 2,
    name: "Sunset Beach Resort",
    location: "Miami",
    pricePerNight: 180,
    ownerId: 102,
  },
];

// ==========================================
// HOTEL ROUTES (CRUD)
// ==========================================

// 1. GET ALL HOTELS
app.get("/api/hotels", (req, res) => {
  res.status(200).json({
    success: true,
    count: hotels.length,
    data: hotels,
  });
});

// 2. GET SINGLE HOTEL
app.get("/api/hotels/:id", (req, res) => {
  const hotel = hotels.find((h) => h.id === parseInt(req.params.id));

  if (!hotel) {
    return res.status(404).json({ success: false, message: "Hotel not found" });
  }

  res.status(200).json({ success: true, data: hotel });
});

// 3. CREATE NEW HOTEL
app.post("/api/hotels", (req, res) => {
  const { name, location, pricePerNight, ownerId } = req.body;

  // Basic validation
  if (!name || !location) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide name and location" });
  }

  const newHotel = {
    id: hotels.length > 0 ? Math.max(...hotels.map((h) => h.id)) + 1 : 1, // Auto-increment ID
    name,
    location,
    pricePerNight: pricePerNight || 0,
    ownerId: ownerId || null,
  };

  hotels.push(newHotel);

  res.status(201).json({
    success: true,
    message: "Hotel created successfully",
    data: newHotel,
  });
});

// 4. UPDATE HOTEL
app.put("/api/hotels/:id", (req, res) => {
  const hotelIndex = hotels.findIndex((h) => h.id === parseInt(req.params.id));

  if (hotelIndex === -1) {
    return res.status(404).json({ success: false, message: "Hotel not found" });
  }

  const updatedHotel = {
    ...hotels[hotelIndex],
    ...req.body, // Merge existing data with new data
    id: hotels[hotelIndex].id, // Ensure ID doesn't change
  };

  hotels[hotelIndex] = updatedHotel;

  res.status(200).json({
    success: true,
    message: "Hotel updated successfully",
    data: updatedHotel,
  });
});

// 5. DELETE HOTEL
app.delete("/api/hotels/:id", (req, res) => {
  const hotelIndex = hotels.findIndex((h) => h.id === parseInt(req.params.id));

  if (hotelIndex === -1) {
    return res.status(404).json({ success: false, message: "Hotel not found" });
  }

  const deletedHotel = hotels[hotelIndex];
  hotels = hotels.filter((h) => h.id !== parseInt(req.params.id));

  res.status(200).json({
    success: true,
    message: "Hotel deleted successfully",
    data: deletedHotel,
  });
});

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

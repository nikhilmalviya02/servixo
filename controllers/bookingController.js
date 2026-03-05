const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      service: req.body.serviceId,
      user: req.user.id,
      address: req.body.address,
      date: req.body.date,
      timeSlot: req.body.timeSlot,
      isEmergency: req.body.isEmergency,
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "service",
        match: { provider: req.user.id },
      })
      .populate("user", "name email");

    const filtered = bookings.filter((b) => b.service);

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    }).populate("service");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    booking.date = req.body.date;
    booking.timeSlot = req.body.timeSlot;
    booking.status = "pending";

    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
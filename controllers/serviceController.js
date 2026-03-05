const Service = require("../models/Service");

exports.createService = async (req, res) => {
  try {
    const service = await Service.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      provider: req.user.id,
    });

    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check if the service belongs to the logged-in provider
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this service" });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { search, category, minRating, maxPrice, sort } = req.query;

    let query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      query.price = { $lte: Number(maxPrice) };
    }

    let services = Service.find(query).populate(
      "provider",
      "name isVerified"
    );

    if (sort === "price" || sort === "price_asc") {
      services = services.sort({ price: 1 });
    }

    if (sort === "price_desc") {
      services = services.sort({ price: -1 });
    }

    if (sort === "rating") {
      services = services.sort({ averageRating: -1 });
    }

    const result = await services;

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
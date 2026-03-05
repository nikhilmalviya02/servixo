const User = require("../models/User");
const Service = require("../models/Service");

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.addresses.push(req.body);

    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProviderProfile = async (req, res) => {
  try {
    const provider = await User.findById(req.params.id).select("-password");

    const services = await Service.find({ provider: req.params.id });

    res.json({ provider, services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );

    await user.save();

    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const address = user.addresses.id(req.params.addressId);

    address.label = req.body.label;
    address.street = req.body.street;
    address.city = req.body.city;
    address.state = req.body.state;
    address.pincode = req.body.pincode;

    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

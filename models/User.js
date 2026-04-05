const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const verificationSchema = new mongoose.Schema({
  aadharCard: {
    number: String,
    documentUrl: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  },
  panCard: {
    number: String,
    documentUrl: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  },
  drivingLicense: {
    number: String,
    documentUrl: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  },
  phone: {
    number: String,
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    otp: String,
    otpExpires: Date
  },
  skillCertificates: [{
    name: String,
    issuer: String,
    issueDate: Date,
    documentUrl: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  }],
  workExperience: [{
    company: String,
    position: String,
    duration: String,
    documentUrl: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  }],
  bankAccount: {
    accountNumber: String,
    ifsc: String,
    holderName: String,
    documentUrl: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  },
  profilePhoto: {
    url: String,
    cloudinaryPublicId: String,
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    verifiedAt: Date,
    rejectionReason: String
  }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: function() {
        return !this.googleId; // Password required only if not using Google OAuth
      },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values (for non-Google users)
    },

    phone: {
      type: String,
    },

    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },

    addresses: [addressSchema],

    isVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
    },

    servicesOffered: {
      type: [String],
      default: [],
    },

    verification: {
      type: verificationSchema,
      default: {}
    },

    overallVerificationStatus: {
      type: String,
      enum: ['not_started', 'partial', 'verified', 'rejected'],
      default: 'not_started'
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);

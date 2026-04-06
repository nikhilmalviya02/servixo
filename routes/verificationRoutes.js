const express = require("express");
const router = express.Router();
const multer = require("multer");
const { cloudinary, createVerificationStorage } = require("../config/cloudinary");
const User = require("../models/User");
const { protect: authMiddleware } = require("../middleware/authMiddleware");

// Configure multer for different verification types using Cloudinary
const aadharStorage = createVerificationStorage('aadhar');
const panStorage = createVerificationStorage('pan');
const licenseStorage = createVerificationStorage('license');
const certificateStorage = createVerificationStorage('certificates');
const experienceStorage = createVerificationStorage('experience');
const bankStorage = createVerificationStorage('bank');
const profileStorage = createVerificationStorage('profile');

const upload = multer({
  storage: createVerificationStorage('general'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, PNG, and PDF files are allowed"));
    }
  },
});

// Bulk verification submission
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    // Handle phone number verification
    if (req.body.phoneNumber) {
      user.verification.phone = {
        ...user.verification.phone,
        number: req.body.phoneNumber,
        isVerified: false,
        status: "pending"
      };
    }

    // This endpoint is for final submission only - files should already be uploaded
    // Update overall verification status
    user.overallVerificationStatus = calculateOverallStatus(user.verification);
    
    await user.save();

    res.json({
      message: "Verification submitted successfully",
      verification: user.verification,
      overallStatus: user.overallVerificationStatus
    });
  } catch (error) {
    console.error("Bulk verification submission error:", error);
    res.status(500).json({ message: "Failed to submit verification" });
  }
});

// Get verification data
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      verification: user.verification || {},
      overallStatus: user.overallVerificationStatus || "not_started"
    });
  } catch (error) {
    console.error("Get verification error:", error);
    res.status(500).json({ message: "Failed to get verification data" });
  }
});

// Update specific verification section
router.put("/:section", authMiddleware, async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    
    const validSections = [
      "aadharCard", "panCard", "drivingLicense", 
      "phone", "bankAccount", "profilePhoto"
    ];

    if (!validSections.includes(section)) {
      return res.status(400).json({ message: "Invalid verification section" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    // Update the specific section
    if (section === "phone") {
      user.verification.phone = {
        ...user.verification.phone,
        ...updateData,
        isVerified: false, // Reset verification when updating
        verifiedAt: null
      };
    } else {
      user.verification[section] = {
        ...user.verification[section],
        ...updateData,
        status: "pending", // Reset to pending when updating
        verifiedAt: null,
        rejectionReason: null
      };
    }

    // Update overall verification status
    user.overallVerificationStatus = calculateOverallStatus(user.verification);
    
    await user.save();

    res.json({
      message: `${section} verification updated successfully`,
      verification: user.verification,
      overallStatus: user.overallVerificationStatus
    });
  } catch (error) {
    console.error("Update verification error:", error);
    res.status(500).json({ message: "Failed to update verification" });
  }
});

// Upload document for verification
router.post("/upload/:section", authMiddleware, (req, res, next) => {
  const { section } = req.params;
  
  const validSections = [
    "aadharCard", "panCard", "drivingLicense", 
    "skillCertificate", "workExperience", 
    "bankAccount", "profilePhoto"
  ];

  if (!validSections.includes(section)) {
    return res.status(400).json({ message: "Invalid verification section" });
  }

  // Create storage for this section
  console.log("Creating storage for section:", section);
  const storage = createVerificationStorage(section);
  console.log("Storage created successfully");

  const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only JPEG, JPG, PNG, and PDF files are allowed"));
      }
    }
  }).single('file');

  // Handle upload
  upload(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        limit: err.limit,
        field: err.field,
        storageError: err.storage
      });
      return res.status(400).json({ 
        message: err.message,
        details: err.code || 'UPLOAD_ERROR'
      });
    }
    console.log("Multer upload successful");
    next();
  });
}, async (req, res) => {
  try {
    const { section } = req.params;
    const file = req.file;
    
    console.log("Upload request received:");
    console.log("- Section:", section);
    console.log("- File:", file);
    console.log("- Request body:", req.body);
    console.log("- User ID:", req.user?.id);
        
    if (!file) {
      console.error("No file received in request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    const documentUrl = file.path; // Cloudinary URL
    console.log("Document URL from Cloudinary:", documentUrl);

    // Handle different section types
    if (section === "skillCertificate") {
          const { name, issuer, issueDate } = req.body;
          
          if (!user.verification.skillCertificates) {
            user.verification.skillCertificates = [];
          }

          user.verification.skillCertificates.push({
            name,
            issuer,
            issueDate: issueDate ? new Date(issueDate) : new Date(),
            documentUrl,
            cloudinaryPublicId: file.filename,
            status: "pending"
          });
        } else if (section === "workExperience") {
          const { company, position, duration } = req.body;
          
          if (!user.verification.workExperience) {
            user.verification.workExperience = [];
          }

          user.verification.workExperience.push({
            company,
            position,
            duration,
            documentUrl,
            cloudinaryPublicId: file.filename,
            status: "pending"
          });
        } else {
          // Single document sections
          if (section === "profilePhoto") {
            // Profile photo uses 'url' field instead of 'documentUrl'
            user.verification[section] = {
              ...user.verification[section],
              url: documentUrl,  // Use 'url' for profilePhoto
              cloudinaryPublicId: file.filename,
              status: "pending",
              verifiedAt: null,
              rejectionReason: null
            };
            console.log("Profile photo saved with URL:", documentUrl);
          } else {
            // Other documents use 'documentUrl' field
            user.verification[section] = {
              ...user.verification[section],
              documentUrl,
              cloudinaryPublicId: file.filename,
              status: "pending",
              verifiedAt: null,
              rejectionReason: null
            };
            console.log("Document saved with URL:", documentUrl);
          }

          // Add additional fields if provided
          if (req.body.number) {
            user.verification[section].number = req.body.number;
          }
          if (req.body.accountNumber) {
            user.verification[section].accountNumber = req.body.accountNumber;
          }
          if (req.body.ifsc) {
            user.verification[section].ifsc = req.body.ifsc;
          }
          if (req.body.holderName) {
            user.verification[section].holderName = req.body.holderName;
          }
          if (req.body.url) {
            user.verification[section].url = req.body.url;
          }
        }

        // Update overall verification status
        user.overallVerificationStatus = calculateOverallStatus(user.verification);
        
        await user.save();

        res.json({
          message: `${section} document uploaded successfully`,
          verification: user.verification,
          overallStatus: user.overallVerificationStatus,
          documentUrl: documentUrl
        });
  } catch (error) {
    console.error("Upload verification error:", error);
    console.error("Error details:", {
      section: req.params.section,
      file: req.file,
      user: req.user,
      body: req.body
    });
    res.status(500).json({ 
      message: "Failed to upload document",
      error: error.message 
    });
  }
});

// Send OTP for phone verification
router.post("/phone/send-otp", authMiddleware, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      return res.status(400).json({ message: "Valid phone number required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize verification object if it doesn't exist
    if (!user.verification) {
      user.verification = {};
    }

    // Generate OTP (in production, use SMS service)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verification.phone = {
      ...user.verification.phone,
      number: phoneNumber,
      otp,
      otpExpires,
      isVerified: false
    };

    await user.save();

    // For development, log the OTP (in production, send via SMS)
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.json({
      message: "OTP sent successfully",
      // In development, return OTP for testing
      otp: process.env.NODE_ENV === "development" ? otp : undefined
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/phone/verify-otp", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: "Valid OTP required" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.verification.phone) {
      return res.status(404).json({ message: "Phone verification not found" });
    }

    const phoneVerification = user.verification.phone;

    // Check if OTP is expired
    if (phoneVerification.otpExpires && new Date() > phoneVerification.otpExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check if OTP matches
    if (phoneVerification.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark as verified
    phoneVerification.isVerified = true;
    phoneVerification.verifiedAt = new Date();
    phoneVerification.otp = undefined;
    phoneVerification.otpExpires = undefined;

    // Update overall verification status
    user.overallVerificationStatus = calculateOverallStatus(user.verification);
    
    await user.save();

    res.json({
      message: "Phone number verified successfully",
      verification: user.verification,
      overallStatus: user.overallVerificationStatus
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Delete skill certificate or work experience
router.delete("/:section/:index", authMiddleware, async (req, res) => {
  try {
    const { section, index } = req.params;
    
    const validSections = ["skillCertificates", "workExperience"];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: "Invalid section for deletion" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.verification) {
      return res.status(404).json({ message: "Verification data not found" });
    }

    const sectionArray = user.verification[section];
    if (!sectionArray || !Array.isArray(sectionArray)) {
      return res.status(404).json({ message: "Section not found" });
    }

    const itemIndex = parseInt(index);
    if (itemIndex < 0 || itemIndex >= sectionArray.length) {
      return res.status(404).json({ message: "Item not found" });
    }

    const itemToDelete = sectionArray[itemIndex];

    // Delete from Cloudinary if publicId exists
    if (itemToDelete.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(itemToDelete.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with local deletion even if Cloudinary fails
      }
    }

    // Remove the item
    sectionArray.splice(itemIndex, 1);

    // Update overall verification status
    user.overallVerificationStatus = calculateOverallStatus(user.verification);
    
    await user.save();

    res.json({
      message: "Item deleted successfully",
      verification: user.verification,
      overallStatus: user.overallVerificationStatus
    });
  } catch (error) {
    console.error("Delete verification item error:", error);
    res.status(500).json({ message: "Failed to delete item" });
  }
});

// Delete single document and replace with new one
router.delete("/:section", authMiddleware, async (req, res) => {
  try {
    const { section } = req.params;
    
    const validSections = [
      "aadharCard", "panCard", "drivingLicense", 
      "bankAccount", "profilePhoto"
    ];

    if (!validSections.includes(section)) {
      return res.status(400).json({ message: "Invalid section for deletion" });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.verification) {
      return res.status(404).json({ message: "Verification data not found" });
    }

    const sectionData = user.verification[section];
    if (!sectionData) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Delete from Cloudinary if publicId exists
    if (sectionData.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(sectionData.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with local deletion even if Cloudinary fails
      }
    }

    // Clear the section data
    user.verification[section] = {
      status: "pending",
      verifiedAt: null,
      rejectionReason: null
    };

    // Update overall verification status
    user.overallVerificationStatus = calculateOverallStatus(user.verification);
    
    await user.save();

    res.json({
      message: "Document deleted successfully",
      verification: user.verification,
      overallStatus: user.overallVerificationStatus
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

// Helper function to calculate overall verification status
function calculateOverallStatus(verification) {
  if (!verification) return "not_started";

  const sections = [
    verification.aadharCard,
    verification.panCard,
    verification.drivingLicense,
    verification.phone,
    verification.bankAccount,
    verification.profilePhoto
  ];

  const verifiedCount = sections.filter(section => section && section.status === "verified").length;
  const pendingCount = sections.filter(section => section && section.status === "pending").length;
  const rejectedCount = sections.filter(section => section && section.status === "rejected").length;

  if (verifiedCount === sections.length) {
    return "verified";
  } else if (rejectedCount > 0) {
    return "rejected";
  } else if (pendingCount > 0 || verifiedCount > 0) {
    return "partial";
  } else {
    return "not_started";
  }
}

module.exports = router;

// Test endpoint for debugging Cloudinary configuration
router.post("/test-cloudinary", authMiddleware, async (req, res) => {
  try {
    console.log("Testing Cloudinary configuration...");
    console.log("Environment vars:", {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "SET" : "NOT SET",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET"
    });

    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    console.log("Cloudinary ping result:", result);

    res.json({ 
      message: "Cloudinary configuration test successful",
      cloudinaryConnected: true,
      result
    });
  } catch (error) {
    console.error("Cloudinary test failed:", error);
    res.status(500).json({ 
      message: "Cloudinary configuration test failed",
      error: error.message,
      cloudinaryConnected: false
    });
  }
});

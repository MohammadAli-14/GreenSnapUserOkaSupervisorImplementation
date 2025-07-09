import express from 'express';
import Report from "../models/Report.js";
import { isAuthenticated, isSupervisor } from "../middleware/auth.js";
import cloudinary from '../lib/cloudinary.js';

const router = express.Router();

// Get pending reports
router.get('/reports', isAuthenticated, isSupervisor, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// Resolve report
router.put('/report/:id/resolve', isAuthenticated, isSupervisor, async (req, res) => {
  try {
    const { image, location, status } = req.body;
    const reportId = req.params.id;
    
    // Upload resolution image
    const uploaded = await cloudinary.uploader.upload(image, {
      folder: 'resolutions'
    });
    
    const resolutionData = {
      status,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolutionImage: uploaded.secure_url,
      resolutionPublicId: uploaded.public_id,
      resolutionLocation: location
    };
    
    const updatedReport = await Report.findByIdAndUpdate(reportId, resolutionData, {
      new: true
    });
    
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: "Failed to resolve report" });
  }
});

export default router;
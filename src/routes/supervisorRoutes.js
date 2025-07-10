import express from 'express';
import Report from "../models/Report.js";
import { isAuthenticated, isSupervisor } from "../middleware/auth.js";
import cloudinary from '../lib/cloudinary.js';

const router = express.Router();

// Update the endpoint to match the frontend request
router.get('/', isAuthenticated, isSupervisor, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' }) // Only pending reports
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (error) {
    console.error("Supervisor report fetch error:", error);
    res.status(500).json({ 
      message: "Failed to fetch reports", 
      error: error.message 
    });
  }
});

// Fix the report detail endpoint
router.get('/:id', isAuthenticated, isSupervisor, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'username profileImage');
      
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch report", 
      error: error.message 
    });
  }
});

// Updated to plural path
router.put('/:id/resolve', isAuthenticated, isSupervisor, async (req, res) => {
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
    res.status(500).json({ 
      message: "Failed to resolve report", 
      error: error.message 
    });
  }
});

export default router;
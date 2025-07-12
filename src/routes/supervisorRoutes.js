import express from 'express';
import Report from "../models/Report.js";
import { isAuthenticated, isSupervisor } from "../middleware/auth.js";
import cloudinary from '../lib/cloudinary.js';

const router = express.Router();

// 1. Changed endpoint to '/reports' for fetching pending reports
// Now accessible at GET /api/supervisor/reports
// routes/supervisorRoutes.js
router.get('/reports', isAuthenticated, isSupervisor, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 })
      .lean(); // Add lean() for better performance
    
    // Add simple debug info
    console.log(`Found ${reports.length} pending reports for supervisor`);
    
    res.status(200).json(reports);
  } catch (error) {
    console.error("Supervisor report fetch error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch reports", 
      error: error.message 
    });
  }
});

// 2. Changed endpoint to '/reports/:id' for fetching a single report
// Now accessible at GET /api/supervisor/reports/:id
router.get('/reports/:id', isAuthenticated, isSupervisor, async (req, res) => {
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

// 3. Changed endpoint to '/reports/:id/resolve' for resolving reports
// Now accessible at PUT /api/supervisor/reports/:id/resolve
router.put('/reports/:id/resolve', isAuthenticated, isSupervisor, async (req, res) => {
  try {
    const { image, location, status } = req.body;
    const reportId = req.params.id;
    
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
const express = require('express')
const Donation = require("../models/Donation.js")
const mongoose = require('mongoose')
const router = express.Router()


// Request a Resource Route :
// Request a Resource
router.post("/request/:resourceId", authenticate, async (req, res) => {
  try {
    const requesterId = req.user._id;
    const { resourceId } = req.params;

    const resource = await Donation.findById(resourceId);
    if (!resource) return res.status(404).json({ message: "Donation not found" });

    // prevent requesting own item
    if (resource.userId.toString() === requesterId.toString()) {
      return res.status(400).json({ message: "You cannot request your own donation" });
    }

    // prevent duplicates
    if (resource.requestedBy.some(r => r.userId.toString() === requesterId.toString())) {
      return res.status(400).json({ message: "Already requested" });
    }

    resource.requestedBy.push({
      userId: requesterId,
      status: "pending",
      requestedAt: Date.now(),
    });

    await resource.save();

    res.json({ message: "Request registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Route for Donor Accepting a Request + Auto-Reject All Others
router.post("/donation/:resourceId/accept/:requesterId", async (req, res) => {
  const donorId = req.user._id;

  const donation = await Donation.findById(req.params.resourceId);
  if (!donation) return res.status(404).send("Donation not found");

  if (donation.userId.toString() !== donorId.toString()) {
    return res.status(403).send("Not authorized");
  }

  // Accept one requester
  donation.requestedBy.forEach(r => {
    if (r.userId.toString() === req.params.requesterId) {
      r.status = "accepted";
    } else {
      r.status = "rejected";
    }
  });

  donation.finalStatus = "in_process";

  await donation.save();
  res.json({ message: "Request accepted and others rejected" });
});


// Route for Marking Donation Completed (Donated)
router.post("/donation/:id/complete", async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) return res.status(404).send("Donation not found");

  donation.finalStatus = "donated";

  await donation.save();
  res.json({ message: "Donation completed" });
});


export default router

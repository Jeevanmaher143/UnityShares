// routes/donationRoutes.js
const express = require("express");
const Donation = require("../models/Donation");
const authenticate = require("../middleware/authenticate");
const router = express.Router();

// Request a resource (user requests a donation)
// Request a resource
router.post("/request/:resourceId", authenticate, async (req, res) => {
  try {
    const requester = req.user._id;
    const resource = await Donation.findById(req.params.resourceId);

    if (!resource)
      return res.status(404).json({ message: "Donation not found" });

    // ❗ PREVENT CRASH: Donation has no userId (old DB records)
    if (!resource.userId) {
      return res.status(400).json({
        message: "This donation record has no donor (userId missing in DB).",
      });
    }

    // Can't request your own donation
    if (resource.userId.toString() === requester.toString()) {
      return res.status(403).json({ message: "You cannot request your own donation" });
    }

    // Prevent duplicate requests
    if (resource.requestedBy.some(r => r.userId?.toString() === requester.toString())) {
      return res.status(400).json({ message: "Already requested" });
    }

    resource.requestedBy.push({ userId: requester, status: "pending" });
    await resource.save();

    const populated = await Donation.findById(resource._id)
      .populate("requestedBy.userId", "name email");

    res.status(201).json({ message: "Request registered", donation: populated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Donor accepts one request and auto-rejects others
router.post("/donation/:resourceId/accept/:requesterId", authenticate, async (req, res) => {
  try {
    const donorId = req.user._id;
    const { resourceId, requesterId } = req.params;

    const donation = await Donation.findById(resourceId);
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    if (donation.userId.toString() !== donorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let found = false;
    donation.requestedBy.forEach((r) => {
      if (!r.userId) return;
      if (r.userId.toString() === requesterId) {
        r.status = "accepted";
        found = true;
      } else {
        r.status = "rejected";
      }
    });

    if (!found) return res.status(404).json({ message: "Requester not found" });

    donation.finalStatus = "in_process";
    await donation.save();

    const populated = await Donation.findById(resourceId).populate("requestedBy.userId", "name email");
    res.json({ message: "Accepted request and rejected others", donation: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark donation completed (donated)
router.post("/donation/:id/complete", authenticate, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    // only donor can mark completed
    if (donation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    donation.finalStatus = "donated";
    await donation.save();

    res.json({ message: "Donation marked as donated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

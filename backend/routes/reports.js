const express = require("express");
const router = express.Router();
const Simulation = require("../models/Simulation"); 

router.get("/summary", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 0;

    const data = await Simulation.find({})
      .sort({ step: 1 })
      .limit(limit > 0 ? limit : 0);

    if (!data.length) {
      return res.json({ data: [], summary: null });
    }

    const keys = ["plants", "herbivores", "carnivores"];

    const summary = {
      avg: {},
      max: {},
      min: {},
    };

    keys.forEach((key) => {
      const values = data.map((d) => d[key]);
      summary.avg[key] = (
        values.reduce((a, b) => a + b, 0) / values.length
      ).toFixed(1);
      summary.max[key] = Math.max(...values);
      summary.min[key] = Math.min(...values);
    });

    res.json({ data, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

module.exports = router;

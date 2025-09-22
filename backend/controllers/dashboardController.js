const Simulation = require("../models/Simulation");

// Get dashboard stats, trend & growth for a logged-in user
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch last 20 simulation steps for this user
    const simulations = await Simulation.find({ userId })
      .sort({ step: -1 })
      .limit(20);

    if (!simulations.length) {
      return res.json({
        stats: { plants: 0, herbivores: 0, carnivores: 0, tick: 0 },
        trend: [],
        growth: { plants: 0, herbivores: 0, carnivores: 0 },
      });
    }

    // Latest snapshot
    const latest = simulations[0];
    const stats = {
      plants: latest.plants,
      herbivores: latest.herbivores,
      carnivores: latest.carnivores,
      tick: latest.step,
    };

    // Build chronological trend (oldest → newest)
    const trend = simulations
      .map((s) => ({
        step: s.step,
        plants: s.plants,
        herbivores: s.herbivores,
        carnivores: s.carnivores,
      }))
      .reverse();

    // Calculate growth % (compare last two points if available)
    const lastTwo = trend.slice(-2);
    let growth = { plants: 0, herbivores: 0, carnivores: 0 };

    if (lastTwo.length === 2) {
      const [prev, curr] = lastTwo;
      growth = {
        plants: prev.plants
          ? (((curr.plants - prev.plants) / prev.plants) * 100).toFixed(1)
          : 0,
        herbivores: prev.herbivores
          ? (((curr.herbivores - prev.herbivores) / prev.herbivores) * 100).toFixed(1)
          : 0,
        carnivores: prev.carnivores
          ? (((curr.carnivores - prev.carnivores) / prev.carnivores) * 100).toFixed(1)
          : 0,
      };
    }

    res.json({ stats, trend, growth });
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = getDashboardData;

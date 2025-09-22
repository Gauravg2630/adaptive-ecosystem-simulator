const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    step: { type: Number, required: true },
    plants: { type: Number, required: true },
    herbivores: { type: Number, required: true },
    carnivores: { type: Number, required: true },

    events: [
      {
        type: { type: String, default: "ecosystem" }, 
        message: { type: String },
        severity: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    template: {
      type: String,
      enum: ["Default", "Savanna", "Rainforest", "Arctic"],
      default: "Default",
    },

    time: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Simulation", simulationSchema);

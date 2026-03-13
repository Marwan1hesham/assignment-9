import mongoose from "mongoose";

const revokeTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      trim: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);

revokeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const revokeTokenModel =
  mongoose.models.revokeToken ||
  mongoose.model("revokeToken", revokeTokenSchema);

export default revokeTokenModel;

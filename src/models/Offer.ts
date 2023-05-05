import mongoose, { Schema, Document } from "mongoose";

export interface OfferDoc extends Document {
  offerType: string; // VANDORS GENERICS
  vandors: [any];
  title: string; // 50% off on ....
  description: string;
  minValue: number; // minimum value on order
  offerAmount: number; // 50%
  startValidity: Date;
  endValidity: Date;
  promocode: string; // Dhruv 50
  promoType: string; // Digital Payements User specific
  bank: [any];
  bins: [any];
  pincode: string;
  isActive: boolean;
}

const OfferSchema = new Schema(
  {
    offerType: { type: String, require: true },
    vandors: [{ type: Schema.Types.ObjectId, ref: "vandor" }],
    title: { type: String, require: true },
    description: { type: String },
    minValue: { type: Number, require: true },
    offerAmount: { type: Number, require: true },
    startValidity: Date,
    endValidity: Date,
    promocode: { type: String, require: true },
    promoType: { type: String, require: true },
    bank: [{ type: String }],
    bins: [{ type: Number }],
    pincode: { type: String, require: true },
    isActive: Boolean,
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    timestamps: true,
  }
);

const Offer = mongoose.model<OfferDoc>("offer", OfferSchema);
export { Offer };

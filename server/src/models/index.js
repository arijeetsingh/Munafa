import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const vendorSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
    name: { type: String, trim: true, maxlength: 60 },
    language: { type: String, enum: ['hi', 'hinglish', 'en'], default: 'hinglish' },
    businessType: { type: String, default: 'chaat' },
    area: { type: String, default: 'Lucknow' },
    closingTime: { type: String, default: '21:30', match: /^\d{2}:\d{2}$/ },
    remindersOn: { type: Boolean, default: true },
    onboarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const recipeLineSchema = new Schema(
  { ingredientKey: { type: String, required: true }, qty: { type: Number, required: true, min: 0 } },
  { _id: false },
);

const menuItemSchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    templateKey: { type: String },
    serving: { type: String, default: '1 plate' },
    price: { type: Number, required: true, min: 0 },
    recipe: [recipeLineSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const entrySchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    type: { type: String, enum: ['expense', 'sale'], required: true },
    category: { type: String, enum: ['ingredient', 'overhead', 'menu', 'sales', 'other'], default: 'other' },
    itemKey: { type: String, required: true },
    item: { type: String, required: true, maxlength: 80 },
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    qty: { type: Number, min: 0 },
    unit: { type: String },
    amount: { type: Number, required: true, min: 0, max: 10000000 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // IST calendar day
    source: { type: String, enum: ['voice', 'text', 'manual', 'seed'], default: 'text' },
    parser: { type: String, enum: ['rules', 'llm', 'none'], default: 'none' },
    rawText: { type: String, maxlength: 500 },
    confidence: { type: Number, min: 0, max: 1 },
    edited: { type: Boolean, default: false }, // vendor changed the parsed result before saving
    clientId: { type: String }, // set by offline queue, used to de-duplicate syncs
  },
  { timestamps: true },
);
entrySchema.index({ vendor: 1, date: -1 });
entrySchema.index({ vendor: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: 'string' } } });

const benchmarkSchema = new Schema({
  ingredientKey: { type: String, required: true },
  area: { type: String, required: true },
  unit: { type: String, required: true },
  medianPrice: { type: Number, required: true },
  sampleSize: { type: Number, required: true },
  source: { type: String, default: 'seed' },
});
benchmarkSchema.index({ ingredientKey: 1, area: 1 }, { unique: true });

// One row per vendor per day: the closing check-in and share events.
const dailySummarySchema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    date: { type: String, required: true },
    cashCounted: { type: Number, min: 0 },
    viewedAt: { type: Date },
    sharedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
dailySummarySchema.index({ vendor: 1, date: 1 }, { unique: true });

const otpSchema = new Schema({
  phone: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const Vendor = model('Vendor', vendorSchema);
export const MenuItem = model('MenuItem', menuItemSchema);
export const Entry = model('Entry', entrySchema);
export const Benchmark = model('Benchmark', benchmarkSchema);
export const DailySummary = model('DailySummary', dailySummarySchema);
export const Otp = model('Otp', otpSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: String,
    category: { type: String, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.plugin(tenantScopePlugin);
productSchema.index({ gymId: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot at time of order
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
  },
  { timestamps: true }
);

orderSchema.plugin(tenantScopePlugin);
orderSchema.index({ gymId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

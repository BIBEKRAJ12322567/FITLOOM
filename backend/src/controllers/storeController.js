const { Product, Order } = require('../models');
const AppError = require('../utils/AppError');
const paymentService = require('../services/paymentService');

/** GET /api/gyms/:gymId/products — public + member view of this gym's supplement store. */
async function listProducts(req, res, next) {
  try {
    const products = await Product.find({ isActive: true }).lean();
    res.status(200).json({ products });
  } catch (err) {
    next(err);
  }
}

/** POST /api/gyms/:gymId/products — owner adds a product. Requires requireGymOwner. */
async function createProduct(req, res, next) {
  try {
    const { name, description, price, stockQty, category } = req.body;
    const product = await Product.create({ name, description, price, stockQty, category });
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/gyms/:gymId/orders — a member buys from this gym's store.
 * With a real gateway configured, the order is created 'pending' and only
 * flips to 'paid' once /api/payments/:paymentId/verify confirms payment;
 * with no gateway configured, paymentService's mock path captures
 * instantly and this marks it 'paid' right away, same as before.
 */
async function createOrder(req, res, next) {
  try {
    const { items } = req.body; // [{ productId, qty }]

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = [];
    let totalAmount = 0;

    for (const { productId, qty } of items) {
      const product = productById.get(String(productId));
      if (!product || !product.isActive) {
        return next(new AppError(`Product ${productId} not found or unavailable`, 404, 'NOT_FOUND'));
      }
      if (product.stockQty < qty) {
        return next(new AppError(`Insufficient stock for "${product.name}"`, 422, 'OUT_OF_STOCK'));
      }
      orderItems.push({ productId: product._id, name: product.name, qty, unitPrice: product.price });
      totalAmount += product.price * qty;
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      status: 'pending',
    });

    // Stock is reserved at order-creation time rather than on payment
    // confirmation — not wrapped in a transaction here since this is a
    // single-gym MVP flow, not a high-concurrency checkout; a production
    // version under real load would want this atomic with the order
    // create, and would likely release reserved stock on payment failure
    // or timeout (not implemented — out of scope for the current flow).
    await Promise.all(
      items.map(({ productId, qty }) => Product.updateOne({ _id: productId }, { $inc: { stockQty: -qty } }))
    );

    const paymentResult = await paymentService.initiatePayment({
      payerUserId: req.user.id,
      gymId: req.params.gymId,
      purpose: 'order',
      relatedEntityId: order._id,
      amount: totalAmount,
    });

    if (!paymentResult.requiresPayment) {
      order.status = 'paid';
      order.paymentId = paymentResult.payment._id;
      await order.save();
    }

    res.status(201).json({
      order,
      requiresPayment: paymentResult.requiresPayment,
      payment: paymentResult.payment,
      razorpayOrder: paymentResult.razorpayOrder || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, createProduct, createOrder };
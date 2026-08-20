import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Loader2, CheckCircle2, Package } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { gymApi } from '../../../api/gymApi';
import { useAuth } from '../../../context/AuthContext';
import { openRazorpayCheckout } from '../../../utils/checkout';

export default function GymStore() {
  const { gymId } = useParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({}); // { productId: qty }
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    gymApi
      .listProducts(gymId)
      .then(setProducts)
      .catch((err) => setError(err.response?.data?.error?.message || 'Could not load the store.'))
      .finally(() => setLoading(false));
  }, [gymId]);

  const updateQty = (productId, delta) => {
    setCart((c) => {
      const next = Math.max(0, (c[productId] || 0) + delta);
      const updated = { ...c, [productId]: next };
      if (next === 0) delete updated[productId];
      return updated;
    });
  };

  const cartItems = Object.entries(cart).map(([productId, qty]) => {
    const product = products.find((p) => p._id === productId);
    return { productId, qty, product };
  });
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.qty, 0);

  const handleCheckout = async () => {
    setCheckingOut(true);
    setOrderError('');
    try {
      const items = cartItems.map(({ productId, qty }) => ({ productId, qty }));
      const result = await gymApi.createOrder(gymId, items);
      if (result.requiresPayment) {
        await openRazorpayCheckout({
          razorpayOrder: result.razorpayOrder,
          payment: result.payment,
          userEmail: user?.email,
          userName: user?.profile?.name,
          description: `Supplement store — ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`,
        });
      }
      setOrderSuccess(result.order);
      setCart({});
    } catch (err) {
      setOrderError(err.response?.data?.error?.message || err.message || 'Checkout failed. Try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to={`/app/gyms/${gymId}`} className="mb-4 flex items-center gap-1.5 text-sm text-muted hover:text-chalk">
        <ArrowLeft size={14} /> Back to gym
      </Link>

      <h1 className="mb-1 font-display text-3xl tracking-wide text-chalk">SUPPLEMENT STORE</h1>
      <p className="mb-6 text-sm text-muted">Order directly from this gym — pick up at the front desk.</p>

      {orderSuccess && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Order placed!</p>
            <p className="mt-0.5 text-success/90">Total ₹{orderSuccess.totalAmount} — see your gym for pickup.</p>
          </div>
        </div>
      )}
      {orderError && <p className="mb-4 text-sm text-danger">{orderError}</p>}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 size={18} className="animate-spin" /> Loading store…
        </div>
      )}
      {error && <p className="py-8 text-center text-sm text-danger">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted">
          <Package size={28} />
          <p className="text-sm">This gym hasn’t listed any products yet.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <Card key={product._id} className="flex flex-col">
              <h3 className="font-semibold text-chalk">{product.name}</h3>
              {product.description && <p className="mt-1 text-sm text-muted">{product.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-lg font-semibold text-tape">₹{product.price}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(product._id, -1)}
                    className="h-7 w-7 rounded-full border border-steel text-chalk hover:bg-raised"
                    disabled={!cart[product._id]}
                  >
                    −
                  </button>
                  <span className="w-4 text-center font-mono text-sm text-chalk">{cart[product._id] || 0}</span>
                  <button
                    onClick={() => updateQty(product._id, 1)}
                    className="h-7 w-7 rounded-full border border-steel text-chalk hover:bg-raised"
                    disabled={product.stockQty <= (cart[product._id] || 0)}
                  >
                    +
                  </button>
                </div>
              </div>
              {product.stockQty <= 5 && product.stockQty > 0 && (
                <p className="mt-1 text-xs text-warning">Only {product.stockQty} left</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {cartItems.length > 0 && (
        <Card className="sticky bottom-4 mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-chalk">
            <ShoppingCart size={18} className="text-tape" />
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · ₹{cartTotal}
          </div>
          <Button onClick={handleCheckout} disabled={checkingOut} size="sm">
            {checkingOut ? 'Placing order…' : 'Checkout'}
          </Button>
        </Card>
      )}
    </div>
  );
}
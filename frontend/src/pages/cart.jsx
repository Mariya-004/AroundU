import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const primaryColor = '#144139';
const secondaryColor = '#C8A46B';
const neutralBg = '#f9f9f9';
const whiteBg = '#fff';

const API_GET_CART = 'https://asia-south1-aroundu-473113.cloudfunctions.net/get_cart';
const API_ADD_TO_CART = 'https://asia-south1-aroundu-473113.cloudfunctions.net/add_to_cart';
const API_REMOVE_ITEM = 'https://asia-south1-aroundu-473113.cloudfunctions.net/remove-from-cart';
const API_UPDATE_ITEM = 'https://asia-south1-aroundu-473113.cloudfunctions.net/update-cart';
// --- ADDED CHECKOUT API ENDPOINT ---
const API_CHECKOUT = 'https://asia-south1-aroundu-473113.cloudfunctions.net/checkout';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [totals, setTotals] = useState({ totalItems: 0, subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // productId being modified
  const [msg, setMsg] = useState('');

  // --- NEW STATE FOR CHECKOUT ---
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const headers = token
        ? { Authorization: `Bearer ${token}`, 'x-auth-token': token }
        : {};

      const res = await fetch(API_GET_CART, { method: 'GET', headers });

      if (!res.ok) {
        let errText = `Error fetching cart: ${res.status}`;
        try {
          const errData = await res.json();
          errText = errData.msg || JSON.stringify(errData);
        } catch {
          const text = await res.text().catch(() => null);
          if (text) errText = text;
        }
        console.error(errText);
        setMsg(errText);
        setCart(null);
        setTotals({ totalItems: 0, subtotal: 0 });
        return;
      }

      let data = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse cart JSON response', parseErr);
        setMsg('Invalid response from server.');
        setCart(null);
        setTotals({ totalItems: 0, subtotal: 0 });
        return;
      }

      setCart(data.cart);
      setTotals(data.totals || { totalItems: 0, subtotal: 0 });
    } catch (err) {
      console.error('Fetch cart error', err);
      setMsg('Failed to load cart. Possible network/CORS error — check browser console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleIncrease = async (item) => {
    setActionLoading(item.productId || item._id);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const body = {
        shopId: cart.shopId._id || cart.shopId,
        productId: item.productId || item._id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl || ''
      };
      const res = await fetch(API_ADD_TO_CART, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.msg || 'Failed to add item.');
      } else {
        // setMsg('Updated cart.'); // Don't show msg, just refetch
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
      setMsg('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecrease = async (item) => {
    setActionLoading(item.productId || item._id);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const newQty = (item.quantity || 1) - 1;

      if (newQty <= 0) {
        // Use the remove endpoint
        await handleRemove(item, true); // Pass flag to skip confirm
      } else {
        // Call update endpoint
        const res = await fetch(API_UPDATE_ITEM, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ productId: item.productId || item._id, quantity: newQty })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(data.msg || 'Failed to update quantity.');
        } else {
          // setMsg('Quantity updated.'); // Don't show msg, just refetch
          await fetchCart();
        }
      }
    } catch (err) {
      console.error(err);
      setMsg('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (item, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Remove this item from cart?')) return;
    setActionLoading(item.productId || item._id);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_REMOVE_ITEM, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ productId: item.productId || item._id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.msg || 'Failed to remove item.');
      } else {
        setMsg('Item removed.');
        await fetchCart();
      }
    } catch (err) {
      console.error(err);
      setMsg('Server error.');
    } finally {
      setActionLoading(null);
    }
  };

  // --- THIS FUNCTION IS NOW UPDATED ---
  const handleCheckout = async () => {
    // 1. Validate the address field
    if (!deliveryAddress.trim()) {
      setMsg('Please enter a delivery address.');
      return;
    }

    setCheckoutLoading(true);
    setMsg(''); // Clear previous messages

    try {
      const token = localStorage.getItem('token');
      // 2. Call the checkout API
      const res = await fetch(API_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ deliveryAddress })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 3. Handle checkout failure (e.g., out of stock)
        setMsg(data.msg || 'Checkout failed. Please try again.');
      } else {
        // 4. Handle checkout success
        setMsg('Order successfully placed! Your cart is now empty.');
        setDeliveryAddress(''); // Clear the address field
        await fetchCart(); // Refresh the cart (it will be empty)
        
        // Optional: You could navigate to a success page
        // navigate(`/order-success/${data._id}`);
      }
    } catch (err) {
      console.error('Checkout error', err);
      setMsg('A network error occurred. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div style={{ background: neutralBg, minHeight: '100vh', padding: 24, fontFamily: "'Poppins', sans-serif", color: primaryColor }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Checkout</h2>
          <div>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: secondaryColor,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ← Continue Shopping
            </button>
          </div>
        </div>

        {msg && <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('error') ? '#f8d7da' : '#d4edda', color: msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('error') ? '#721c24' : '#155724' }}>{msg}</div>}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading cart...</div>
        ) : !cart || !cart.products || cart.products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: whiteBg, borderRadius: 12 }}>Your cart is empty.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
            <div>
              {/* Product list */}
              {cart.products.map((item) => (
                <div key={item.productId || item._id} style={{ display: 'flex', gap: 16, alignItems: 'center', background: whiteBg, padding: 12, borderRadius: 12, marginBottom: 12, border: '1px solid #eee' }}>
                  <div style={{ width: 90, height: 90, borderRadius: 8, overflow: 'hidden', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#999' }}>No Image</span>}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ color: '#666', fontSize: 14 }}>{item.shopName || (cart.shopId && cart.shopId.name) || ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: secondaryColor, fontWeight: 700, fontSize: 16 }}>₹ {(item.price || 0).toFixed(2)}</div>
                        <div style={{ fontSize: 12, color: '#777' }}>each</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => handleDecrease(item)}
                        disabled={actionLoading === (item.productId || item._id)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                      >
                        −
                      </button>
                      <div style={{ minWidth: 36, textAlign: 'center', fontWeight: 700 }}>{item.quantity || 1}</div>
                      <button
                        onClick={() => handleIncrease(item)}
                        disabled={actionLoading === (item.productId || item._id)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                      >
                        +
                      </button>

                      <button
                        onClick={() => handleRemove(item)}
                        style={{ marginLeft: 12, padding: '6px 10px', borderRadius: 8, border: 'none', background: '#f8d7da', color: '#721c24', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                      {actionLoading === (item.productId || item._id) && <div style={{ marginLeft: 8 }}>Processing...</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <aside style={{ background: whiteBg, padding: 20, borderRadius: 12, height: 'fit-content', border: '1px solid #eee' }}>
              <h3 style={{ marginTop: 0 }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>Items</div>
                <div>{totals.totalItems}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>Subtotal</div>
                <div style={{ fontWeight: 700 }}>₹ {(totals.subtotal || 0).toFixed(2)}</div>
              </div>
              <div style={{ borderTop: '1px dashed #eee', margin: '12px 0' }} />

                {/* --- NEW DELIVERY ADDRESS FIELD --- */}
                <div style={{ marginBottom: 12, marginTop: 12 }}>
                  <label htmlFor="deliveryAddress" style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                    Delivery Address
                  </label>
                  <textarea
                    id="deliveryAddress"
                    rows="3"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full address for delivery"
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: "'Poppins', sans-serif", fontSize: 14 }}
                    disabled={checkoutLoading}
                  />
                </div>
                {/* ---------------------------------- */}

              <button
                onClick={handleCheckout}
                disabled={(totals.totalItems || 0) === 0 || checkoutLoading}
                style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: 8, 
                    border: 'none', 
                    background: primaryColor, 
                    color: '#fff', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    opacity: ((totals.totalItems || 0) === 0 || checkoutLoading) ? 0.6 : 1
                  }}
              >
                {checkoutLoading ? 'Placing Order...' : 'Proceed to Checkout'}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const primaryColor = '#144139';
const secondaryColor = '#C8A46B';
const neutralBg = '#f9f9f9';
const whiteBg = '#fff';

const API_GET_CART = 'https://asia-south1-aroundu-473113.cloudfunctions.net/get_cart';
const API_ADD_TO_CART = 'https://asia-south1-aroundu-473113.cloudfunctions.net/add_to_cart';
const API_REMOVE_ITEM = 'https://asia-south1-aroundu-473113.cloudfunctions.net/remove-from-cart';
const API_UPDATE_ITEM = 'https://asia-south1-aroundu-473113.cloudfunctions.net/update-cart'; // optional

export default function CartPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [totals, setTotals] = useState({ totalItems: 0, subtotal: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // productId being modified
    const [msg, setMsg] = useState('');

    const fetchCart = async () => {
        setLoading(true);
        setMsg('');
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
            setMsg('Failed to load cart. Possible network/CORS error — check browser console and ensure backend allows this origin.');
            setCart(null);
            setTotals({ totalItems: 0, subtotal: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleIncrease = async (item) => {
        setActionLoading(item.productId || item._id);
        setMsg('');
        try {
            const token = localStorage.getItem('token');
            const body = {
                shopId: cart?.shopId?._id || cart?.shopId,
                productId: item.productId || item._id,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl || ''
            };
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
            const res = await fetch(API_ADD_TO_CART, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMsg(data.msg || 'Failed to add item.');
            } else {
                setMsg('Updated cart.');
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
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                };
                const res = await fetch(API_REMOVE_ITEM, {
                    method: 'DELETE',
                    headers,
                    body: JSON.stringify({ productId: item.productId || item._id })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setMsg(data.msg || 'Failed to remove item.');
                } else {
                    setMsg('Item removed.');
                    await fetchCart();
                }
            } else {
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                };
                const res = await fetch(API_UPDATE_ITEM, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ productId: item.productId || item._id, quantity: newQty })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setMsg(data.msg || 'Failed to update quantity.');
                } else {
                    setMsg('Quantity updated.');
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

    const handleRemove = async (item) => {
        if (!window.confirm('Remove this item from cart?')) return;
        setActionLoading(item.productId || item._id);
        setMsg('');
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
            const res = await fetch(API_REMOVE_ITEM, {
                method: 'DELETE',
                headers,
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

    const handleClearCart = async () => {
        if (!window.confirm('Clear entire cart?')) return;
        setMsg('');
        try {
            const token = localStorage.getItem('token');
            const headers = {
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };
            const res = await fetch(API_ADD_TO_CART, {
                method: 'DELETE',
                headers
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMsg(data.msg || 'Failed to clear cart.');
            } else {
                setMsg('Cart cleared.');
                await fetchCart();
            }
        } catch (err) {
            console.error(err);
            setMsg('Server error.');
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
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
                                marginRight: 12,
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#eee',
                                cursor: 'pointer'
                            }}
                        >
                            ← Continue Shopping
                        </button>
                    </div>
                </div>

                {msg && <div style={{ marginBottom: 12, color: msg.toLowerCase().includes('failed') ? 'red' : 'green' }}>{msg}</div>}

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>Loading cart...</div>
                ) : !cart || !cart.products || cart.products.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', background: whiteBg, borderRadius: 12 }}>Your cart is empty.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
                        <div>
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
                                                <div style={{ marginTop: 6, color: '#555', fontSize: 13 }}>{item.description || ''}</div>
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
                                                disabled={actionLoading === (item.productId || item._id)}
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
                            <button
                                onClick={handleCheckout}
                                disabled={(totals.totalItems || 0) === 0}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', background: primaryColor, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Proceed to Checkout
                            </button>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
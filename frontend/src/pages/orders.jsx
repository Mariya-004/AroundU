import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const primaryColor = '#144139';
const neutralBg = '#f9f9f9';
const whiteBg = '#fff';
const secondaryColor = '#C8A46B';
const dangerColor = '#dc3545';
const successColor = '#19c37d';

const API_GET_STATUS = 'https://asia-south1-aroundu-473113.cloudfunctions.net/get_status';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setErr('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('You are not logged in.');

        const res = await fetch(API_GET_STATUS, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Failed to fetch orders');

        const fetched = data.orders || [];
        setOrders(fetched);
      } catch (e) {
        console.error('Error fetching orders:', e);
        setErr(e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusStyle = (status) => {
    let bg = '#eef5ff', color = '#1f5bbf';
    if (status.includes('reject')) {
      bg = '#fdecea'; color = dangerColor;
    } else if (status.includes('deliver')) {
      bg = '#e6f9ef'; color = successColor;
    } else if (status.includes('accept')) {
      bg = '#e9f7e9'; color = '#0b8a4a';
    }
    return { background: bg, color };
  };

  if (loading) return <div style={{ padding: 24 }}>Loading your orders...</div>;
  if (err) return <div style={{ padding: 24, color: dangerColor }}>{err}</div>;

  return (
    <div style={{ padding: 24, background: neutralBg, minHeight: '100vh', color: primaryColor }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Your Orders</h2>

        {orders.length === 0 ? (
          <div
            style={{
              background: whiteBg,
              borderRadius: 8,
              padding: 30,
              textAlign: 'center',
              color: '#666',
              border: '1px solid #eee',
            }}
          >
            You haven’t placed any orders yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 15 }}>
            {orders.map((order) => (
              <div
                key={order._id}
                style={{
                  background: whiteBg,
                  borderRadius: 12,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid #f0f0f0',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    Order ID: <span style={{ color: '#555' }}>{order._id}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#777', marginTop: 4 }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 15 }}>
                    Total: <strong>₹{order.totalAmount.toFixed(2)}</strong>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: 13,
                        textTransform: 'capitalize',
                        ...getStatusStyle(order.status || 'pending'),
                      }}
                    >
                      {order.status ? order.status.replace(/_/g, ' ') : 'pending'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => navigate(`/order/${order._id}`)}
                    style={{
                      background: primaryColor,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => navigate('/track-order', { state: { orderId: order._id } })}
                    style={{
                      background: '#fff',
                      color: primaryColor,
                      border: `1px solid ${primaryColor}`,
                      borderRadius: 6,
                      padding: '8px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

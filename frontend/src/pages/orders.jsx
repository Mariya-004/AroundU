import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const primaryColor = '#144139';
const neutralBg = '#f9f9f9';
const whiteBg = '#fff';

const API_GET_ORDERS = 'https://asia-south1-aroundu-473113.cloudfunctions.net/get_customer_orders';
const API_GET_STATUS = 'https://asia-south1-aroundu-473113.cloudfunctions.net/get_status'; // new: get-status endpoint

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
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(API_GET_ORDERS, { method: 'GET', headers });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.msg || `Failed to fetch orders (${res.status})`);
        }
        const data = await res.json();
        const fetched = data.orders || data || [];
        setOrders(fetched);
        // fetch latest status for each order
        await fetchStatuses(fetched, headers);
      } catch (e) {
        console.error('Fetch orders error', e);
        setErr(e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    // fetch orders + statuses
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch status for each order in parallel and update state
  const fetchStatuses = async (ordersList, headers = {}) => {
    if (!ordersList || ordersList.length === 0) return;
    try {
      const statusPromises = ordersList.map(async (order) => {
        const id = order._id || order.id;
        if (!id) return order;
        try {
          const url = `${API_GET_STATUS}?orderId=${encodeURIComponent(id)}`;
          const res = await fetch(url, { method: 'GET', headers });
          if (!res.ok) return order;
          const data = await res.json().catch(() => null);
          if (data && data.status) {
            return { ...order, status: data.status };
          }
          return order;
        } catch (e) {
          return order;
        }
      });

      const updated = await Promise.all(statusPromises);
      setOrders(updated);
    } catch (e) {
      console.error('Error fetching statuses', e);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading orders...</div>;
  if (err) return <div style={{ padding: 24, color: 'red' }}>{err}</div>;

  if (!orders || orders.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Your Orders</h2>
        <div style={{ padding: 24, background: whiteBg, borderRadius: 8 }}>You have not placed any orders yet.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: neutralBg, minHeight: '100vh', color: primaryColor }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Your Orders</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {orders.map((order) => (
            <div
              key={order._id || order.id}
              style={{
                background: whiteBg,
                padding: 16,
                borderRadius: 8,
                border: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong>Order {order._id || order.id}</strong>
                  <div style={{ color: '#666', fontSize: 13 }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                  </div>
                  <div style={{ color: '#666', fontSize: 13 }}>
                    {order.shopName || (order.shop && order.shop.name) || ''}
                  </div>
                </div>

                <div style={{ marginTop: 8, color: '#444', fontSize: 14 }}>
                  {Array.isArray(order.products) ? `${order.products.length} item(s)` : ''}
                  {' • '}
                  <strong>₹ {(order.totalAmount || order.total || 0).toFixed(2)}</strong>
                </div>

                {order.status && (
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        background:
                          order.status === 'delivered'
                            ? '#e6f9ef'
                            : order.status.includes('reject')
                            ? '#fdecea'
                            : '#eef5ff',
                        color:
                          order.status === 'delivered'
                            ? '#0b8a4a'
                            : order.status.includes('reject')
                            ? '#a12b2b'
                            : '#1f5bbf',
                      }}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => navigate(`/order/${order._id || order.id}`)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: primaryColor,
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>

                <button
                  onClick={() =>
                    navigate('/track-order', { state: { orderId: order._id || order.id } })
                  }
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: '#fff',
                    color: primaryColor,
                    cursor: 'pointer',
                  }}
                >
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- API ENDPOINTS ---
const API_GET_PRODUCTS = "https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products";
const API_GET_AGENTS = "https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent_availability";
const API_GET_SHOP_ORDERS = "https://asia-south1-aroundu-473113.cloudfunctions.net/get_shop_orders";

// --- COLOR SCHEME ---
const primaryColor = "#144139";
const secondaryColor = "#C8A46B";
const successColor = "#19c37d";
const dangerColor = "#dc3545";
const warningColor = "#ffc107"; // For pending orders
const neutralBg = "#f9f9f9";
const whiteBg = "#fff";
const borderColor = "#e0e0e0";

const actionBtnStyle = {
  padding: "10px 15px",
  background: primaryColor,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.2s",
};

// --- STYLES ---
const containerStyle = {
  background: neutralBg,
  minHeight: "100vh",
  padding: "25px",
  fontFamily: "Poppins, sans-serif",
  color: primaryColor,
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const shopCardStyle = {
  background: whiteBg,
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "20px",
};

const tabContainerStyle = {
  display: "flex",
  marginBottom: "20px",
  borderBottom: `1px solid ${borderColor}`,
  overflowX: "auto",
};

const tabStyle = (isActive) => ({
  padding: "10px 20px",
  cursor: "pointer",
  fontWeight: isActive ? "600" : "normal",
  color: isActive ? primaryColor : "#777",
  borderBottom: isActive ? `2px solid ${primaryColor}` : "2px solid transparent",
  transition: "all 0.2s ease-in-out",
  whiteSpace: "nowrap",
});

const searchInputStyle = {
  width: "100%",
  padding: "12px 15px 12px 40px",
  borderRadius: "8px",
  border: `1px solid ${borderColor}`,
  fontSize: "1rem",
  outline: "none",
  background: `${whiteBg} url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>') no-repeat 10px center`,
  backgroundSize: "20px",
  marginBottom: "15px",
};

const productListItemStyle = {
  background: whiteBg,
  borderRadius: "12px",
  padding: "15px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  marginBottom: "10px",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  cursor: "pointer",
};

const productListImageStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "8px",
  objectFit: "cover",
  flexShrink: 0,
};

const floatingButtonStyle = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  background: secondaryColor,
  color: primaryColor,
  fontSize: "2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  cursor: "pointer",
  border: "none",
  outline: "none",
  zIndex: 1000,
};

const profileIconStyle = {
  cursor: "pointer",
  color: "#888",
  fontSize: "1.4rem",
};

const tabContentStyle = {
  flexGrow: 1,
  background: whiteBg,
  borderRadius: "16px",
  padding: "25px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const loadingStyle = {
  textAlign: "center",
  color: "#777",
  padding: "50px",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "50px",
  border: `1px dashed ${borderColor}`,
  borderRadius: "12px",
  background: "#fdfdfd",
};

// --- Order Card Component ---
const OrderCard = ({ order }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return warningColor;
      case "accepted":
        return primaryColor;
      case "picked_up":
        return "#17a2b8"; // Info color
      case "delivered":
        return successColor;
      default:
        return borderColor;
    }
  };

  const statusStyle = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    background: getStatusColor(order.status),
    color: whiteBg,
    fontWeight: "600",
    fontSize: "0.8rem",
    textTransform: "capitalize",
    marginBottom: "15px",
  };

  const orderCardStyle = {
    background: neutralBg,
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "15px",
    border: `1px solid ${borderColor}`,
  };

  const productItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#555",
    padding: "5px 0",
  };

  return (
    <div style={orderCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
          Order #{order._id.slice(-6)}
        </h4>
        <div style={statusStyle}>{order.status}</div>
      </div>
      
      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>
        <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
        <br />
        <strong>Customer:</strong> {order.customerId?.name || "N/A"} (
        {order.customerId?.email || "N/A"})
        <br />
        <strong>Address:</strong> {order.deliveryAddress}
      </div>

      <h5 style={{ margin: "15px 0 5px 0", borderTop: `1px dashed ${borderColor}`, paddingTop: "10px" }}>
        Items
      </h5>
      {order.products.map((item) => (
        <div key={item.productId} style={productItemStyle}>
          <span>
            {item.name} (x{item.quantity})
          </span>
          <span style={{ fontWeight: "600" }}>
            ₹{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      ))}

      <div style={{ ...productItemStyle, borderTop: `1px solid ${borderColor}`, marginTop: "10px", paddingTop: "10px" }}>
        <strong style={{ fontSize: "1.1rem", color: primaryColor }}>Total</strong>
        <strong style={{ fontSize: "1.1rem", color: primaryColor }}>
          ₹{order.totalAmount.toFixed(2)}
        </strong>
      </div>

      {order.status === 'pending' && (
        <button style={{ ...actionBtnStyle, marginTop: "15px", width: "100%" }}>
          Accept Order
        </button>
      )}
    </div>
  );
};

export default function ShopkeeperProductManager() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState({ name: "Your Shop", id: null });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  // Agents State
  const [showAgents, setShowAgents] = useState(false);
  const [agents, setAgents] = useState([]);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // --- FETCH PRODUCTS ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_GET_PRODUCTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) setMessage(data.msg || "Failed to fetch products");
      else {
        setShopInfo({
          name: data.shopName || "Your Shop",
          id: data.shopId,
        });
        setProducts(data.products || []);
      }
    } catch (err) {
      setMessage("Server error, please try again later");
    } finally {
      setLoadingProducts(false);
    }
  };

  // --- FETCH ORDERS ---
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_GET_SHOP_ORDERS, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      } else {
        setMessage(data.msg || "Failed to fetch orders.");
      }
    } catch (err) {
      setMessage("Server error while fetching orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // --- Initial product fetch on mount ---
  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Fetch data when tab changes ---
  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) {
      fetchOrders();
    }
    // Add logic for other tabs here if needed
  }, [activeTab]);

  // --- FETCH DELIVERY AGENT STATUS ---
  const handleViewAgents = async () => {
    setShowAgents(!showAgents);
    if (showAgents) return; // hide if already visible
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_GET_AGENTS, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAgents(data.agents || []);
      } else {
        alert(data.msg || "Failed to fetch delivery agents.");
      }
    } catch (err) {
      alert("Server error while fetching agents.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleProfileSetup = () => {
    navigate("/shopkeeper-setup-profile");
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={containerStyle}>
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", color: primaryColor, margin: 0 }}>
          AroundU Dashboard
        </h1>

        {/* Profile + Agents + Logout */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <span
            style={profileIconStyle}
            onClick={handleProfileSetup}
            title="Setup Profile"
          >
            👤
          </span>

          <button
            style={{ ...actionBtnStyle, background: secondaryColor, color: primaryColor }}
            onClick={handleViewAgents}
          >
            {showAgents ? "Hide Agents" : "View Agents"}
          </button>

          <button
            style={{
              ...actionBtnStyle,
              background: dangerColor,
              padding: "8px 15px",
              fontSize: "0.9rem",
            }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Shop Info */}
      <h1 style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>
        Welcome, {shopInfo.name.split(" ")[0]}!
      </h1>
      <div style={shopCardStyle}>
        <div>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "1.4rem" }}>
            {shopInfo.name}
          </h3>
          <p style={{ margin: "0 0 0 0", color: "#666", fontSize: "0.9rem" }}>
            Grocery Store
          </p>
        </div>
      </div>

      {/* Delivery Agents Modal Section */}
      {showAgents && (
        <div
          style={{
            background: whiteBg,
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginBottom: "15px", color: primaryColor }}>
            Delivery Agent Availability
          </h3>
          {agents.length === 0 ? (
            <p style={{ color: "#777" }}>No delivery agents found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {agents.map((agent, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: neutralBg,
                    borderRadius: "8px",
                    padding: "10px 15px",
                    marginBottom: "10px",
                  }}
                >
                  <span>{agent.name}</span>
                  <span
                    style={{
                      color: agent.isAvailable ? successColor : dangerColor,
                      fontWeight: "600",
                    }}
                  >
                    {agent.isAvailable ? "🟢 Available" : "🔴 Unavailable"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={tabContainerStyle}>
        <div
          style={tabStyle(activeTab === "products")}
          onClick={() => setActiveTab("products")}
        >
          Products
        </div>
        <div
          style={tabStyle(activeTab === "orders")}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </div>
        <div
          style={tabStyle(activeTab === "reviews")}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </div>
      </div>

      {/* --- Product Tab --- */}
      {activeTab === "products" && (
        <div style={tabContentStyle}>
          <h2 style={{ color: primaryColor, marginBottom: "20px" }}>
            YOUR PRODUCTS
          </h2>

          <div style={{ position: "relative", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search products..."
              style={searchInputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {message && (
            <p
              style={{
                color: dangerColor,
                marginBottom: "20px",
                padding: "10px",
                background: "#ffebeb",
                borderRadius: "8px",
              }}
            >
              {message}
            </p>
          )}

          {loadingProducts && <p style={loadingStyle}>Loading products...</p>}

          {!loadingProducts && filteredProducts.length === 0 ? (
            <div style={emptyStateStyle}>
              <h3 style={{ color: "#777" }}>No Products Found</h3>
              <p>
                Click the{" "}
                <span style={{ color: secondaryColor, fontWeight: "bold" }}>
                  +
                </span>{" "}
                button to add your first item.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  style={productListItemStyle}
                  onClick={() =>
                    navigate(`/edit-product/${shopInfo.id}/${product._id}`)
                  }
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={productListImageStyle}
                    />
                  ) : (
                    <div
                      style={{
                        ...productListImageStyle,
                        background: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#aaa",
                        fontSize: "0.7rem",
                      }}
                    >
                      No Image
                    </div>
                  )}

                  <div style={{ flexGrow: 1 }}>
                    <p
                      style={{
                        margin: "0 0 3px 0",
                        fontSize: "0.85rem",
                        color:
                          product.stock > 0 ? successColor : dangerColor,
                        fontWeight: "600",
                      }}
                    >
                      {product.stock > 0 ? "In stock" : "Out of stock"}
                    </p>
                    <h4
                      style={{
                        margin: "0 0 3px 0",
                        fontSize: "1.1rem",
                        color: primaryColor,
                      }}
                    >
                      {product.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#777" }}>
                      {product.stock} in stock
                    </p>
                  </div>

                  <div style={{ cursor: "pointer", padding: "5px" }}>
                    <span style={{ fontSize: "1.2rem", color: "#888" }}>
                      &#8942;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Orders Tab --- */}
      {activeTab === "orders" && (
        <div style={tabContentStyle}>
          <h2 style={{ color: primaryColor, marginBottom: "20px" }}>
            INCOMING ORDERS
          </h2>

          {message && (
            <p
              style={{
                color: dangerColor,
                marginBottom: "20px",
                padding: "10px",
                background: "#ffebeb",
                borderRadius: "8px",
              }}
            >
              {message}
            </p>
          )}

          {loadingOrders && <p style={loadingStyle}>Loading orders...</p>}

          {!loadingOrders && orders.length === 0 ? (
            <div style={emptyStateStyle}>
              <h3 style={{ color: "#777" }}>No Orders Found</h3>
              <p>New orders from customers will appear here.</p>
            </div>
          ) : (
            <div>
              {orders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Reviews Tab (Placeholder) --- */}
      {activeTab === "reviews" && (
        <div style={tabContentStyle}>
          <h2 style={{ color: primaryColor, marginBottom: "20px" }}>
            CUSTOMER REVIEWS
          </h2>
          <div style={emptyStateStyle}>
            <h3 style={{ color: "#777" }}>No Reviews Yet</h3>
            <p>Customer reviews for your shop will appear here.</p>
          </div>
        </div>
      )}

      {/* Floating Add Product Button */}
      <button
        style={floatingButtonStyle}
        onClick={() => navigate("/add-product")}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0b87b")}
        onMouseLeave={(e) => (e.currentTarget.style.background = secondaryColor)}
      >
        +
      </button>
    </div>
  );
}
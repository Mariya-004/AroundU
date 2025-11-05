import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- COLOR SCHEME ---
const primaryColor = "#144139";
const secondaryColor = "#C8A46B";
const successColor = "#19c37d";
const dangerColor = "#dc3545";
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

export default function ShopkeeperProductManager() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState({ name: "Your Shop", id: null });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [showAgents, setShowAgents] = useState(false);
  const [agents, setAgents] = useState([]);

  // --- FETCH PRODUCTS ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- FETCH DELIVERY AGENT STATUS ---
  const handleViewAgents = async () => {
    setShowAgents(!showAgents);
    if (showAgents) return; // hide if already visible
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent_availability",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        // Expecting backend to return { agents: [ {name, isAvailable}, ...] }
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

          {/* NEW BUTTON */}
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

      {/* Product Tab */}
      {activeTab === "products" && (
        <div
          style={{
            flexGrow: 1,
            background: whiteBg,
            borderRadius: "16px",
            padding: "25px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
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

          {loading && (
            <p style={{ textAlign: "center", color: "#777" }}>
              Loading products...
            </p>
          )}

          {!loading && filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px",
                border: `1px dashed ${borderColor}`,
                borderRadius: "12px",
                background: "#fdfdfd",
              }}
            >
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
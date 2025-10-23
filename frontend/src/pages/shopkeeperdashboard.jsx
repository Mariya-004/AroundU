import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Define common styles for consistency
const primaryColor = "#144139"; // Dark green
const secondaryColor = "#C8A46B"; // Gold/brown
const successColor = "#19c37d"; // Green for 'In stock'
const dangerColor = "#dc3545"; // Red for 'Out of stock'
const neutralBg = "#f9f9f9";
const whiteBg = "#fff";
const borderColor = "#e0e0e0";

// FIX: Re-defining the generic actionBtnStyle for use
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

const basePadding = "25px"; // Adjust overall padding

// --- Remaining Styles ---
const containerStyle = {
  background: neutralBg,
  minHeight: "100vh",
  padding: basePadding,
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

// **REMOVED** shopImagePlaceholderStyle

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
  boxSizing: "border-box",
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
  transition: "background 0.2s, transform 0.2s",
};

// Style for the Profile icon
const profileIconStyle = {
  cursor: 'pointer', 
  color: '#888', 
  fontSize: '1.4rem',
};

export default function ShopkeeperProductManager() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  // Removed imageUrl from initial state
  const [shopInfo, setShopInfo] = useState({ name: "Your Shop", id: null }); 
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  // --- Data Fetching Logic ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage(data.msg || "Failed to fetch products");
        } else {
          setShopInfo({ 
            name: data.shopName || "Your Shop", 
            id: data.shopId,
            // Removed handling of data.shopImageUrl
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

  const handleLogout = () => {
    console.log("Logging out...");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleProfileSetup = () => {
    navigate("/shopkeeper-setup-profile");
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={containerStyle}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <h1 style={{ fontSize: '1.5rem', color: primaryColor, margin: 0 }}>AroundU Dashboard</h1>
        
        {/* Profile Logo and Logout Button */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span 
            style={profileIconStyle}
            onClick={handleProfileSetup}
            title="Setup Profile"
          >
            👤
          </span>
          
          <button
            style={{ ...actionBtnStyle, background: dangerColor, padding: '8px 15px', fontSize: '0.9rem', marginRight: 0 }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Welcome Message & Shop Card */}
      <h1 style={{ fontSize: "2rem", color: primaryColor, margin: "0 0 10px 0" }}>
        Welcome, {shopInfo.name.split(' ')[0]}!
      </h1>
      <div style={shopCardStyle}>
        {/* Removed Shop Image Slot */}
        <div>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "1.4rem", color: primaryColor }}>
            {shopInfo.name}
          </h3>
          <p style={{ margin: "0 0 0 0", color: "#666", fontSize: "0.9rem" }}>Grocery Store</p>
          {/* Removed Shop Timing Line */}
        </div>
      </div>

      {/* Tabs */}
      <div style={tabContainerStyle}>
        <div style={tabStyle(activeTab === "products")} onClick={() => setActiveTab("products")}>
          Products
        </div>
        <div style={tabStyle(activeTab === "orders")} onClick={() => setActiveTab("orders")}>
          Orders
        </div>
        <div style={tabStyle(activeTab === "reviews")} onClick={() => setActiveTab("reviews")}>
          Reviews
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "products" && (
        <div style={{ flexGrow: 1, background: whiteBg, borderRadius: "16px", padding: basePadding, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <h2 style={{ color: primaryColor, marginBottom: "20px" }}>YOUR PRODUCTS</h2>

          {/* Search Bar */}
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search products..."
              style={searchInputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Message */}
          {message && (
            <p style={{ color: dangerColor, marginBottom: "20px", padding: "10px", background: "#ffebeb", borderRadius: "8px" }}>
              {message}
            </p>
          )}

          {/* Loading State */}
          {loading && <p style={{ textAlign: "center", fontSize: "1.1rem", color: "#777" }}>Loading products...</p>}

          {/* Product List */}
          {!loading && filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px", border: `1px dashed ${borderColor}`, borderRadius: "12px", background: "#fdfdfd" }}>
              <h3 style={{ color: "#777" }}>No Products Found</h3>
              <p>Click the <span style={{ color: secondaryColor, fontWeight: 'bold' }}>+</span> button to add your first item.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  style={productListItemStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(5px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                  }}
                  onClick={() => navigate(`/edit-product/${shopInfo.id}/${product._id}`)}
                >
                  {/* Product Image/Placeholder */}
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={productListImageStyle}
                    />
                  ) : (
                    <div style={{ ...productListImageStyle, background: "#f0f0f0", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.7rem' }}>
                      No Image
                    </div>
                  )}

                  {/* Product Details */}
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ margin: "0 0 3px 0", fontSize: "0.85rem", color: product.stock > 0 ? successColor : dangerColor, fontWeight: "600" }}>
                      {product.stock > 0 ? "In stock" : "Out of stock"}
                    </p>
                    <h4 style={{ margin: "0 0 3px 0", fontSize: "1.1rem", color: primaryColor }}>
                      {product.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#777" }}>
                      {product.stock} in stock
                    </p>
                  </div>

                  {/* More Options (Three dots icon - simulated) */}
                  <div style={{ cursor: 'pointer', padding: '5px', borderRadius: '50%', '&:hover': { background: '#eee' } }}>
                    <span style={{ fontSize: '1.2rem', color: '#888' }}>&#8942;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div style={{ flexGrow: 1, background: whiteBg, borderRadius: "16px", padding: basePadding, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center", color: "#777" }}>
          <h2 style={{ color: primaryColor, marginBottom: "20px" }}>Orders</h2>
          <p>Orders management coming soon!</p>
        </div>
      )}

      {activeTab === "reviews" && (
        <div style={{ flexGrow: 1, background: whiteBg, borderRadius: "16px", padding: basePadding, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center", color: "#777" }}>
          <h2 style={{ color: primaryColor, marginBottom: "20px" }}>Reviews</h2>
          <p>Reviews section coming soon!</p>
        </div>
      )}

      {/* Floating Add Product Button */}
      <button
        style={floatingButtonStyle}
        onClick={() => navigate("/add-product")}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#e0b87b')}
        onMouseLeave={(e) => (e.currentTarget.style.background = secondaryColor)}
      >
        +
      </button>
    </div>
  );
}
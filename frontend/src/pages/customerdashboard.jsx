import React from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user?.name || "Guest";

  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "30px 20px",
        fontFamily: "'Poppins', sans-serif",
        color: "#144139",
      }}
    >
      {/* Greeting */}
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Hi {userName} 👋</h2>

      {/* Profile Setup Button */}
      <button
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          background: "#C8A46B",
          color: "#144139",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
        onClick={() => navigate("/customer-profile")}
      >
        Profile Setup
      </button>
       {/* Map Button */}
      <button
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          background: "#144139",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
        onClick={() => navigate("/customer-map")}
      >
        View Map
      </button>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for shops, items..."
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "1rem",
          borderRadius: "10px",
          border: "1px solid #ccc",
          marginBottom: "30px",
        }}
      />

      {/* Explore Nearby Section */}
      <div
        style={{
          background: "#f0f0f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Explore Nearby</h3>
        <p style={{ fontSize: "0.95rem", color: "#555" }}>
          Discover shops and services around your location.
        </p>
        <button
          style={{
            marginTop: "10px",
            padding: "10px 20px",
            background: "#144139",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Explore Now
        </button>
      </div>

      {/* Order Tracking */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Track Your Order</h3>
        <div
          style={{
            background: "#f9f9f9",
            padding: "15px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0 }}>Order #21354</p>
            <p style={{ margin: 0 }}>The Corner Store</p>
            <p style={{ margin: 0 }}>Est. delivery: 20 min</p>
          </div>
          <span style={{ fontSize: "2rem" }}>🛵</span>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Recommended For You</h3>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          {["Groceries", "Electronics", "Clothing", "Pharmacy"].map((category) => (
            <div
              key={category}
              style={{
                flex: "1 1 45%",
                background: "#f0f0f0",
                padding: "20px",
                borderRadius: "10px",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Recent Orders</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "10px" }}>
            <strong>The Corner Store</strong> — Order #21354 —{" "}
            <span style={{ color: "green" }}>Delivered</span>
          </li>
          <li>
            <strong>The Tech Shop</strong> — Order #21353 —{" "}
            <span style={{ color: "green" }}>Delivered</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
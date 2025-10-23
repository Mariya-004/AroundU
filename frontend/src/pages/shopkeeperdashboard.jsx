import React from "react";
import { useNavigate } from "react-router-dom";

// Define styles outside the component for cleaner JSX
const actionBtnStyle = {
  padding: "10px 20px",
  background: "#144139",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  marginRight: "10px", // Added for spacing between buttons
};

const tableHeaderStyle = {
  background: "#f0f0f0",
  textAlign: "left",
  padding: "12px",
  fontWeight: "600",
};

const tableRowStyle = {
  borderBottom: "1px solid #ddd",
};

export default function ShopkeeperDashboard() {
  const navigate = useNavigate();

  // Placeholder function for handling logout
  const handleLogout = () => {
    // In a real application, you would clear auth tokens,
    // update state, and redirect the user.
    console.log("Logging out...");
    navigate("/login"); // Assuming a login route
  };

  // Define the standard dashboard features
  const quickActions = [
    { label: "+ Add Product", path: "/add-product", color: "#19c37d", textColor: "#fff" },
    { label: "View Your Products", path: "/shop-products", color: "#144139", textColor: "#fff" },
    { label: "View Insights", path: "/shop-insights", color: "#C8A46B", textColor: "#144139" },
  ];

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      {/* Header with Logout Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.8rem", margin: 0 }}>Shopkeeper Dashboard</h2>
        <button
          style={{ ...actionBtnStyle, background: "#dc3545", marginRight: 0 }} // Use a red color for logout
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* --- */}

      {/* Profile Setup / Onboarding Alert */}
      <div style={{ marginBottom: "30px", border: "1px solid #C8A46B", padding: "15px", borderRadius: "8px", background: "#fffaf0" }}>
        <h3 style={{ fontSize: "1.2rem", color: "#C8A46B", margin: "0 0 10px 0" }}>⚠️ Setup Required</h3>
        <p style={{ margin: "0 0 15px 0" }}>Please complete your shop profile to unlock all features.</p>
        <button
          style={{
            ...actionBtnStyle,
            background: "#C8A46B",
            color: "#144139",
            fontWeight: "600",
            padding: "8px 15px"
          }}
          onClick={() => navigate("/shopkeeper-setup-profile")}
        >
          Set Up Your Profile
        </button>
      </div>

      {/* --- */}

      {/* Key Stats (Empty/Placeholder) */}
      <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Key Metrics (Placeholder)</h3>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "40px" }}>
        {['Total Sales', 'Total Orders', 'Pending Orders', 'Priority Alerts'].map((label) => (
          <div
            key={label}
            style={{
              flex: "1 1 200px",
              background: "#f9f9f9",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: "600",
              minWidth: "180px",
            }}
          >
            <p style={{ marginBottom: "8px", color: "#777" }}>{label}</p>
            <h3 style={{ margin: 0, fontSize: "1.8rem" }}>---</h3> {/* Placeholder content */}
          </div>
        ))}
      </div>

      {/* --- */}

      {/* Quick Actions */}
      <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Quick Actions</h3>
      <div style={{ marginBottom: "40px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {quickActions.map((action) => (
          <button
            key={action.label}
            style={{
              ...actionBtnStyle,
              background: action.color,
              color: action.textColor,
              // Overriding actionBtnStyle's default margin on the last button
              marginRight: "0",
              marginBottom: "10px", // For wrapping
            }}
            onClick={() => navigate(action.path)}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* --- */}

      {/* Recent Orders (Empty/Placeholder) */}
      <div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "15px" }}>Recent Orders (Placeholder)</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th style={{ padding: "12px" }}>Order ID</th>
              <th style={{ padding: "12px" }}>Customer</th>
              <th style={{ padding: "12px" }}>Date</th>
              <th style={{ padding: "12px" }}>Total</th>
              <th style={{ padding: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Conditional rendering for real data goes here */}
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                No recent orders found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
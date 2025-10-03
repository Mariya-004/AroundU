import React from "react";
import { useNavigate } from "react-router-dom";

export default function DeliveryAgentDashboard() {
  const navigate = useNavigate();

  const stats = {
    todaysEarnings: "$45.50",
    totalDeliveries: 21,
    totalEarnings: "$1,500.00",
  };

  const activeRequests = [
    {
      id: "#10524",
      pickup: "Emily Carter",
      drop: "Michael Street, New York, NY 10001",
    },
    {
      id: "#10523",
      pickup: "John Doe",
      drop: "Broadway Ave, New York, NY 10002",
    },
  ];

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Delivery Agent Dashboard</h2>

      {/* Set Profile Button */}
      <div style={{ marginBottom: "20px" }}>
        <button
          style={{
            ...actionBtnStyle,
            background: "#C8A46B",
            color: "#144139",
            marginBottom: "10px"
          }}
          onClick={() => navigate("/deliveryagent-setprofile")}
        >
          Set Profile
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        {Object.entries(stats).map(([label, value]) => (
          <div
            key={label}
            style={{
              flex: "1 1 200px",
              background: "#f9f9f9",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            <p style={{ marginBottom: "8px" }}>{label.replace(/([A-Z])/g, " $1")}</p>
            <h3 style={{ margin: 0 }}>{value}</h3>
          </div>
        ))}
      </div>

      {/* Active Requests */}
      <div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Active Requests</h3>
        {activeRequests.map((req) => (
          <div
            key={req.id}
            style={{
              background: "#f9f9f9",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: 0 }}>Order {req.id}</p>
              <p style={{ margin: 0 }}>Pickup: {req.pickup}</p>
              <p style={{ margin: 0 }}>Drop: {req.drop}</p>
            </div>
            <button style={actionBtnStyle}>Accept Delivery</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const actionBtnStyle = {
  padding: "10px 20px",
  background: "#144139",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};
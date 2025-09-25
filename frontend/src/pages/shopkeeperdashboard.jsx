import React from "react";

export default function ShopkeeperDashboard() {
  const stats = {
    totalSales: "$2,450",
    totalOrders: 32,
    pendingOrders: 5,
    priorityAlerts: 1,
  };

  const recentOrders = [
    { id: "#10524", customer: "Emily Carter", date: "12 Dec 2023", total: "$210.75" },
    { id: "#10523", customer: "John Doe", date: "12 Dec 2023", total: "$150.00" },
    { id: "#10522", customer: "Alice Brown", date: "11 Dec 2023", total: "$89.99" },
    { id: "#10521", customer: "Brian Clark", date: "11 Dec 2023", total: "$120.00" },
    { id: "#10520", customer: "Steve Smith", date: "10 Dec 2023", total: "$75.50" },
  ];

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Shopkeeper Dashboard</h2>

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

      {/* Quick Actions */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "15px" }}>
          <button style={actionBtnStyle}>Add New Product</button>
          <button style={actionBtnStyle}>View Insights</button>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Recent Orders</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={tableHeaderStyle}>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} style={tableRowStyle}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.date}</td>
                <td>{order.total}</td>
                <td>
                  <button style={{ ...actionBtnStyle, padding: "6px 12px", fontSize: "0.9rem" }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

const tableHeaderStyle = {
  background: "#f0f0f0",
  textAlign: "left",
  padding: "12px",
  fontWeight: "600",
};

const tableRowStyle = {
  borderBottom: "1px solid #ddd",
  padding: "12px",
};

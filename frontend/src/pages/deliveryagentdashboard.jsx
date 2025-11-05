import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DeliveryAgentDashboard() {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- MOCK STATS (Replace with real APIs later) ---
  const stats = {
    todaysEarnings: "$45.50",
    totalDeliveries: 21,
    totalEarnings: "$1,500.00",
  };

  const activeRequests = [
    {
      id: "#10524",
      pickup: "Asha's Boutique, Palace Road",
      drop: "John Doe, Rose Garden Apartments, Flat 3B",
    },
    {
      id: "#10523",
      pickup: "Lulu Hypermarket, Service Rd",
      drop: "Jane Smith, West Fort, Thrissur",
    },
  ];
  // --- END MOCK DATA ---

  // Fetch delivery agent's availability from the new API
  useEffect(() => {
    const fetchAvailability = async () => {
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
          setIsAvailable(data.isAvailable || false);
        } else {
          setError(data.msg || "Failed to fetch availability status.");
        }
      } catch (err) {
        console.error(err);
        setError("Server error while fetching status.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  // Handle toggle to PATCH the updated status
  const handleAvailabilityToggle = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus); // optimistic UI update

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent_availability",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isAvailable: newStatus,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        console.error(data);
        setIsAvailable(!newStatus); // revert on error
        alert(data.msg || "Failed to update availability. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setIsAvailable(!newStatus);
      alert("Network error. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}></div>
        <p style={{ color: "#144139", marginTop: "10px" }}>
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Dashboard</h2>
          <div style={styles.controls}>
            <div style={styles.availability}>
              <span style={styles.availabilityLabel}>Availability</span>
              <label style={styles.switch}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={handleAvailabilityToggle}
                />
                <span
                  style={{
                    ...styles.slider,
                    ...(isAvailable ? styles.sliderChecked : {}),
                  }}
                ></span>
              </label>
            </div>
            <button
              style={styles.profileBtn}
              onClick={() => navigate("/deliveryagent-setprofile")}
              className="profile-btn-hover"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div style={styles.statsGrid}>
          {Object.entries(stats).map(([label, value]) => (
            <div key={label} style={styles.statItem}>
              <p style={styles.statLabel}>
                {label.replace(/([A-Z])/g, " $1")}
              </p>
              <h3 style={styles.statValue}>{value}</h3>
            </div>
          ))}
        </div>

        {/* Active Requests Section */}
        <div>
          <h3 style={styles.sectionTitle}>Active Requests</h3>
          {activeRequests.length > 0 ? (
            activeRequests.map((req) => (
              <div key={req.id} style={styles.requestItem}>
                <div style={styles.requestInfo}>
                  <p style={{ ...styles.requestText, fontWeight: "600" }}>
                    Order {req.id}
                  </p>
                  <p style={styles.requestText}>
                    <span style={{ fontWeight: 500 }}>Pickup:</span> {req.pickup}
                  </p>
                  <p style={styles.requestText}>
                    <span style={{ fontWeight: 500 }}>Drop:</span> {req.drop}
                  </p>
                </div>
                <button
                  style={styles.actionBtn}
                  className="action-btn-hover"
                >
                  Accept Delivery
                </button>
              </div>
            ))
          ) : (
            <p>No active requests right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
  container: {
    background: "#f0f2f5",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "30px",
    fontFamily: "'Poppins', sans-serif",
    color: "#144139",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "900px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: { fontSize: "1.8rem", margin: 0 },
  controls: { display: "flex", alignItems: "center", gap: "25px" },
  availability: { display: "flex", alignItems: "center", gap: "10px" },
  availabilityLabel: { fontWeight: "500", fontSize: "0.9rem" },
  profileBtn: {
    padding: "10px 20px",
    background: "#C8A46B",
    color: "#144139",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statItem: {
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
  },
  statLabel: { margin: "0 0 8px 0", textTransform: "capitalize", color: "#555" },
  statValue: { margin: 0, fontSize: "1.5rem" },
  sectionTitle: {
    fontSize: "1.2rem",
    marginBottom: "15px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  requestItem: {
    background: "#f9f9f9",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },
  requestInfo: { flex: "1 1 300px" },
  requestText: { margin: "0 0 5px 0" },
  actionBtn: {
    padding: "10px 20px",
    background: "#144139",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.3s",
  },
  loader: {
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #C8A46B",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
  },
  switch: {
    position: "relative",
    display: "inline-block",
    width: "50px",
    height: "28px",
  },
  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ccc",
    transition: ".4s",
    borderRadius: "34px",
  },
  sliderChecked: { backgroundColor: "#4CAF50" },
};

// Inject CSS for animations and hover effects
const dynamicCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
  
  input:checked + span { background-color: #2E7D32; }
  input:checked + span:before { transform: translateX(22px); }

  .profile-btn-hover:hover {
      background-color: #b7905a;
      transform: translateY(-2px);
  }

  .action-btn-hover:hover {
      background-color: #0d2a25;
      transform: translateY(-2px);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

if (!document.getElementById("dynamic-styles-delivery-dashboard")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "dynamic-styles-delivery-dashboard";
  styleSheet.innerText = dynamicCSS;
  document.head.appendChild(styleSheet);
}

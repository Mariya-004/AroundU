import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DeliveryAgentDashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(""); // store user role
  const [isAvailable, setIsAvailable] = useState(false);
  const [agents, setAgents] = useState([]); // for shopkeeper
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL =
    "https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent_availability";

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return setError("No token found. Please log in.");

        const res = await fetch(API_URL, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Fetched Data:", data);

        if (res.ok) {
          // Case 1: Delivery Agent → has isAvailable
          if (data.isAvailable !== undefined) {
            setIsAvailable(data.isAvailable);
            setRole("delivery_agent");
          }
          // Case 2: Shopkeeper → has agents array
          else if (Array.isArray(data.agents)) {
            setAgents(data.agents);
            setRole("shopkeeper");
          }
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

  // Toggle handler (delivery agent only)
  const handleAvailabilityToggle = async () => {
    if (role !== "delivery_agent") return;
    const newStatus = !isAvailable;
    setIsAvailable(newStatus); // Optimistic UI update

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        setIsAvailable(!newStatus);
        alert(data.msg || "Failed to update availability. Please try again.");
      } else {
        console.log("Availability updated:", data);
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

  if (error) {
    return (
      <div style={styles.container}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {role === "shopkeeper"
              ? "Delivery Agents Overview"
              : "Delivery Agent Dashboard"}
          </h2>
          {role === "delivery_agent" && (
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
          )}
        </div>

        {/* --- Shopkeeper View --- */}
        {role === "shopkeeper" && (
          <>
            <h3 style={styles.sectionTitle}>All Delivery Agents</h3>
            {agents.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent._id}>
                      <td>{agent.name}</td>
                      <td>
                        <span
                          style={{
                            color: agent.isAvailable ? "green" : "red",
                            fontWeight: "bold",
                          }}
                        >
                          {agent.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td>
                        {agent.location
                          ? `${agent.location.coordinates[1]}, ${agent.location.coordinates[0]}`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No delivery agents found.</p>
            )}
          </>
        )}

        {/* --- Delivery Agent View --- */}
        {role === "delivery_agent" && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <p style={styles.statLabel}>Today's Earnings</p>
                <h3 style={styles.statValue}>$45.50</h3>
              </div>
              <div style={styles.statItem}>
                <p style={styles.statLabel}>Total Deliveries</p>
                <h3 style={styles.statValue}>21</h3>
              </div>
              <div style={styles.statItem}>
                <p style={styles.statLabel}>Total Earnings</p>
                <h3 style={styles.statValue}>$1,500.00</h3>
              </div>
            </div>
          </>
        )}
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
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

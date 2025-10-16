import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User } from "lucide-react"; // Using lucide-react for icons, you may need to install it: npm install lucide-react

export default function CustomerDashboard() {
  const navigate = useNavigate();
  // Mock data for demonstration, replace with actual state/API data
  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user?.name || "Customer";
  const activeOrdersCount = 2;
  const ongoingDeliveriesCount = 3;

  // Reusable Card Component for better readability and structure
  const DashboardCard = ({ title, description, actionText, onClick, imageSrc }) => (
    <div
      style={{
        flex: "1 1 45%", // Allows two cards per row on larger screens
        minWidth: "250px",
        background: "#ffffff",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "box-shadow 0.3s",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'}
      onClick={onClick}
    >
      <div style={{ marginRight: "15px" }}>
        <h4 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#333", marginBottom: "5px" }}>{title}</h4>
        <p style={{ fontSize: "0.95rem", color: "#555", marginBottom: "15px" }}>{description}</p>
        <span
          style={{
            fontSize: "0.9rem",
            color: "#007bff", // A common link color
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          {actionText} &rarr;
        </span>
      </div>
      {/* Image Placeholder */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={title}
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "8px",
            objectFit: "cover",
            background: "#f0f0f0", // Fallback color
          }}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        background: "#f7f7f7", // Light background for the overall page
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif", // Using a modern font
        color: "#333",
      }}
    >
      {/* --- Top Header/Navigation Bar --- */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #ebebeb",
          padding: "10px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#007bff", marginRight: "30px" }}>AroundU</h1>
          {/* Nav Links (Optional, based on the image) */}
          <nav style={{ display: "flex", gap: "20px" }}>
            {["Home", "Shops", "Items", "Orders"].map((link) => (
              <span
                key={link}
                style={{
                  fontSize: "1rem",
                  color: link === "Home" ? "#007bff" : "#555",
                  fontWeight: link === "Home" ? "600" : "400",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/${link.toLowerCase()}`)}
              >
                {link}
              </span>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Global Search (as seen in the top right of the image) */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search"
              style={{
                padding: "8px 15px 8px 40px",
                borderRadius: "20px",
                border: "1px solid #ddd",
                width: "250px",
                fontSize: "0.95rem",
                background: "#f0f4f8", // Light background for the search box
              }}
            />
            <Search size={20} color="#777" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          </div>
          <Bell size={24} color="#555" style={{ cursor: "pointer" }} />
          <User size={24} color="#555" style={{ cursor: "pointer" }} onClick={() => navigate("/customer-profile")} />
        </div>
      </header>

      <div style={{ padding: "30px 40px" }}>
        {/* --- Main Dashboard Content --- */}

        {/* --- Primary Search Bar (Large, centered below the header) --- */}
        <div
          style={{
            background: "#ffffff",
            padding: "15px 20px",
            borderRadius: "10px",
            border: "1px solid #ebebeb",
            marginBottom: "40px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Search size={20} color="#999" style={{ marginRight: "10px" }} />
          <input
            type="text"
            placeholder="Search for items or shops"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              background: "transparent",
            }}
          />
        </div>

        {/* --- Your Activity Section --- */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#333", marginBottom: "20px" }}>Your Activity</h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          {/* Active Orders Card */}
          <DashboardCard
            title="Active Orders"
            description={`You have ${activeOrdersCount} active orders`}
            actionText="View Orders"
            onClick={() => navigate("/customer-orders")}
            imageSrc="https://via.placeholder.com/80/f7e0c4/000000?text=Bag" // Placeholder image for order
          />
          {/* Ongoing Deliveries Card */}
          <DashboardCard
            title="Ongoing Deliveries"
            description={`${ongoingDeliveriesCount} deliveries in progress`}
            actionText="Track Now"
            onClick={() => navigate("/customer-deliveries")}
            imageSrc="https://via.placeholder.com/80/ffffff/000000?text=Truck" // Placeholder image for delivery
          />
        </div>

        {/* --- Explore Nearby Section --- */}
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#333", marginBottom: "20px" }}>Explore Nearby</h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          {/* Nearby Shops Card */}
          <DashboardCard
            title="Nearby Shops"
            description="Discover shops near you"
            actionText="Explore"
            onClick={() => navigate("/customer-map")}
            imageSrc="https://via.placeholder.com/80/ffffff/000000?text=Shop1" // Placeholder image for a shop
          />
          {/* Recent Shops Card */}
          <DashboardCard
            title="Recent Shops"
            description="Your favorite shops"
            actionText="View Again"
            onClick={() => navigate("/customer-recents")}
            imageSrc="https://via.placeholder.com/80/ffffff/000000?text=Shop2" // Placeholder image for a shop
          />
        </div>

        

      </div>
    </div>
  );
}
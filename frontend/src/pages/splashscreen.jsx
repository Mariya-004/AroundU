import React from "react";
import { useNavigate } from "react-router-dom";

const backgroundColor = "#144139ff"; // Dark green background

export default function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: backgroundColor,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between", // center content with buttons at bottom
        padding: "40px 20px",
        color: "white",
        textAlign: "center",
      }}
    >
      {/* Spacer for top */}
      <div></div>

      {/* Logo */}
      <img
        src={"LOGO.png"}
        alt="AroundU Logo"
        style={{
          width: "320px",
          maxWidth: "85vw",
          marginBottom: "30px",
        }}
      />

      {/* Services */}
      <div style={{ maxWidth: "700px", marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "2rem",
            marginBottom: "20px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: "600",
          }}
        >
          🌟 Our Services
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            fontSize: "1.4rem",
            lineHeight: "2.2",
            fontFamily: "'Raleway', sans-serif", // Stylish font applied here
            fontWeight: "500",
          }}
        >
          <li>🛍️ Connect with local shops instantly</li>
          <li>🚚 Get doorstep delivery in minutes</li>
          <li>📍 Track your orders live</li>
          <li>💰 Exclusive neighborhood deals</li>
          <li>🤝 Support small businesses nearby</li>
        </ul>
      </div>

      {/* Login/Signup Buttons */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "25px" }}>
        <button
          style={{
            padding: "14px 40px",
            fontSize: "1.3rem",
            borderRadius: "10px",
            border: "none",
            background: "#C8A46B",
            color: "#184C43",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => navigate('/login')}
        >
          Login
        </button>
        <button
          style={{
            padding: "14px 40px",
            fontSize: "1.3rem",
            borderRadius: "10px",
            background: "#184C43",
            color: "#C8A46B",
            fontWeight: "bold",
            cursor: "pointer",
            border: "2px solid #C8A46B",
          }}
        >
          Signup
        </button>
      </div>
    </div>
  );
}

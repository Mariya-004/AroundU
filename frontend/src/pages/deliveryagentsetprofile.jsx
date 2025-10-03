import React, { useState } from "react";

export default function DeliveryAgentProfileSetup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    vehicleType: "Bike",
    currentLocation: "", // address string or [lon, lat]
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/deliveryagent-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Failed to update profile");
      } else {
        setMessage(data.msg);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Delivery Agent Profile Setup</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <select
          name="vehicleType"
          value={formData.vehicleType}
          onChange={handleChange}
          required
          style={{ ...inputStyle, padding: "12px" }}
        >
          <option value="Bike">Bike</option>
          <option value="Scooter">Scooter</option>
          <option value="Car">Car</option>
          <option value="Van">Van</option>
        </select>
        <input
          type="text"
          name="currentLocation"
          placeholder="Current Location (e.g., Thrissur Railway Station)"
          value={formData.currentLocation}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        {message && <p style={{ color: message.includes("successfully") ? "green" : "red" }}>{message}</p>}

        <button type="submit" style={submitBtnStyle}>
          Save Profile
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: "14px",
  fontSize: "1rem",
  borderRadius: "10px",
  border: "1px solid #ccc",
};

const submitBtnStyle = {
  padding: "14px",
  fontSize: "1.2rem",
  borderRadius: "10px",
  background: "#C8A46B",
  color: "#144139",
  fontWeight: "bold",
  cursor: "pointer",
  border: "none",
  marginTop: "10px",
};

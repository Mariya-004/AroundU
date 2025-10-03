import React, { useState } from "react";

export default function ShopkeeperProfileSetup() {
  const [formData, setFormData] = useState({
    shopName: "",
    shopAddress: "",
    shopLocation: "", // now a place name like "Lulu Mall, Kochi"
    shopPhoneNumber: "",
    shopCategory: "",
    shopDescription: "",
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
      const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Failed to save profile");
      } else {
        setMessage(data.msg);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Complete Your Shop Profile</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <input
          type="text"
          name="shopName"
          placeholder="Shop Name"
          value={formData.shopName}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="shopAddress"
          placeholder="Shop Address"
          value={formData.shopAddress}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="shopLocation"
          placeholder="Shop Location (e.g., Lulu Mall, Kochi)"
          value={formData.shopLocation}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <input
          type="text"
          name="shopPhoneNumber"
          placeholder="Shop Phone Number"
          value={formData.shopPhoneNumber}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        <select
  name="shopCategory"
  value={formData.shopCategory}
  onChange={handleChange}
  required
  style={{ ...inputStyle, padding: "12px" }}
>
  <option value="">Select Category</option>
  <option value="Grocery">Grocery</option>
  <option value="Electronics">Electronics</option>
  <option value="Clothing">Clothing</option>
  <option value="Pharmacy">Pharmacy</option>
  <option value="Bakery">Bakery</option>
  <option value="Stationery">Stationery</option>
  <option value="Salon">Salon</option>
</select>
        <textarea
          name="shopDescription"
          placeholder="Tell us a little about your shop..."
          value={formData.shopDescription}
          onChange={handleChange}
          rows={4}
          style={{ ...inputStyle, resize: "none" }}
        />

        {message && <p style={{ color: message.includes("successfully") ? "green" : "red" }}>{message}</p>}

        <button type="submit" style={submitBtnStyle}>
          Save and Continue
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

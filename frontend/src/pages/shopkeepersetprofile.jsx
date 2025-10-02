import React, { useState } from "react";

export default function ShopkeeperProfileSetup() {
  const [formData, setFormData] = useState({
    shopName: "",
    shopAddress: "",
    // --- CHANGE 1: Separate fields for latitude and longitude ---
    latitude: "",
    longitude: "",
    shopPhoneNumber: "",
    shopCategory: "Grocery",
    shopDescription: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Added for better UX

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // --- CHANGE 2: Construct the correct shopLocation object ---
    const submissionData = {
      ...formData,
      shopLocation: {
        type: "Point",
        // Note: Coordinates must be numbers, and in [longitude, latitude] order
        coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
      },
    };
    // Remove the separate lat/lng fields from the final submission
    delete submissionData.latitude;
    delete submissionData.longitude;


    try {
      const token = localStorage.getItem("token");
      // --- CHANGE 3: Use the full, correct API endpoint URL ---
      const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData), // Send the formatted data
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Failed to save profile");
      } else {
        setMessage(data.msg);
      }
    } catch (err) {
      setMessage("A server error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Complete Your Shop Profile</h2>

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Fields for shopName, shopAddress, etc. remain the same... */}
        <input type="text" name="shopName" placeholder="Shop Name" value={formData.shopName} onChange={handleChange} required style={inputStyle} />
        <input type="text" name="shopAddress" placeholder="Shop Address" value={formData.shopAddress} onChange={handleChange} required style={inputStyle} />
        
        {/* --- CHANGE 4: Updated inputs for location --- */}
        <div style={{ display: "flex", gap: "20px" }}>
            <input type="number" step="any" name="latitude" placeholder="Latitude (e.g., 9.9312)" value={formData.latitude} onChange={handleChange} required style={{...inputStyle, width: "100%"}} />
            <input type="number" step="any" name="longitude" placeholder="Longitude (e.g., 76.2673)" value={formData.longitude} onChange={handleChange} required style={{...inputStyle, width: "100%"}}/>
        </div>

        <input type="text" name="shopPhoneNumber" placeholder="Shop Phone Number" value={formData.shopPhoneNumber} onChange={handleChange} required style={inputStyle} />
        <select name="shopCategory" value={formData.shopCategory} onChange={handleChange} style={{ ...inputStyle, padding: "12px" }}>
          <option value="Grocery">Grocery</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Pharmacy">Pharmacy</option>
        </select>
        <textarea name="shopDescription" placeholder="Tell us a little about your shop..." value={formData.shopDescription} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: "none" }} />

        {message && <p style={{ color: message.includes("successfully") ? "green" : "red", textAlign: "center" }}>{message}</p>}

        <button type="submit" disabled={loading} style={submitBtnStyle}>
          {loading ? "Saving..." : "Save and Continue"}
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
  outline: "none"
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
  opacity: "1"
};
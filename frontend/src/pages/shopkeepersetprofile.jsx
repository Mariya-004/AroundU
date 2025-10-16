import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png", // shop icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

export default function ShopkeeperProfileSetup() {
  const [formData, setFormData] = useState({
    shopName: "",
    shopAddress: "",
    shopLocation: "",
    shopPhoneNumber: "",
    shopCategory: "",
    shopDescription: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState(null); // For map preview

  // --- FETCH EXISTING SHOP PROFILE ON LOAD ---
  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("Please log in first.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          "https://asia-south1-aroundu-473113.cloudfunctions.net/shop-profile",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();

        if (res.ok && data.shopExists && data.shop) {
          setFormData({
            shopName: data.shop.name || "",
            shopAddress: data.shop.address || "",
            shopLocation: data.shop.address || "", // Display readable address
            shopPhoneNumber: data.shop.phoneNumber || "",
            shopCategory: data.shop.category || "",
            shopDescription: data.shop.description || "",
          });

          if (data.shop.location && data.shop.location.coordinates) {
            const [lng, lat] = data.shop.location.coordinates;
            setCoordinates([lat, lng]);
          }

          setMessage("Loaded existing shop profile.");
        } else if (!data.shopExists) {
          setMessage("No existing shop profile found. Please create one.");
        } else {
          setMessage(data.msg || "Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching shop profile:", error);
        setMessage("Error fetching shop profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopProfile();
  }, []);

  // --- HANDLE FORM CHANGES ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- HANDLE SUBMIT (CREATE / UPDATE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://asia-south1-aroundu-473113.cloudfunctions.net/shop-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (res.ok && data.shop && data.shop.location) {
        const [lng, lat] = data.shop.location.coordinates;
        setCoordinates([lat, lng]);
      }

      setMessage(res.ok ? data.msg : data.msg || "Failed to save profile");
    } catch (err) {
      console.error("Error saving shop profile:", err);
      setMessage("Server error while saving profile.");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h2>Loading your shop profile...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Poppins, sans-serif",
        color: "#144139",
      }}
    >
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>
        {formData.shopName ? "Edit Your Shop Profile" : "Complete Your Shop Profile"}
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
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

        {/* --- MAP PREVIEW SECTION --- */}
        {coordinates && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>📍 Shop Location Preview</h4>
            <MapContainer
              center={coordinates}
              zoom={15}
              style={{ height: "250px", width: "100%", borderRadius: "10px" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={coordinates} icon={shopIcon}>
                <Popup>{formData.shopName || "Your Shop"}</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {message && (
          <p
            style={{
              color: message.toLowerCase().includes("successfully") ? "green" : "red",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <button type="submit" style={submitBtnStyle}>
          {formData.shopName ? "Update Shop Profile" : "Save and Continue"}
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

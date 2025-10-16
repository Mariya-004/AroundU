import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom shop icon
const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
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
  const [shopCoords, setShopCoords] = useState(null); // [lat, lng]
  const [loading, setLoading] = useState(true);

  // ✅ Fetch existing shop profile when page loads
  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return setMessage("Unauthorized: Please log in.");

        const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop-profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok && data.shopExists && data.shop) {
          setFormData({
            shopName: data.shop.name || "",
            shopAddress: data.shop.address || "",
            shopLocation: data.shop.locationName || "", // ✅ correct field
            shopPhoneNumber: data.shop.phoneNumber || "",
            shopCategory: data.shop.category || "",
            shopDescription: data.shop.description || "",
          });

          if (data.shop.location?.coordinates) {
            const [lng, lat] = data.shop.location.coordinates;
            setShopCoords([lat, lng]);
          }

          setMessage("Loaded existing shop details.");
        } else {
          setMessage("No existing shop profile found. Please create one.");
        }
      } catch (err) {
        console.error("Error fetching shop profile:", err);
        setMessage("Failed to fetch shop profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchShopProfile();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Submit form (create/update shop profile)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) return setMessage("Unauthorized: Please log in.");

      const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.msg || "Profile saved successfully!");
        if (data.shop?.location?.coordinates) {
          const [lng, lat] = data.shop.location.coordinates;
          setShopCoords([lat, lng]);
        }
      } else {
        setMessage(data.msg || "Failed to save profile.");
      }
    } catch (err) {
      console.error("Error saving shop profile:", err);
      setMessage("Server error while saving profile.");
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "20%" }}>Loading...</p>;

  return (
    <div style={{ background: "#fff", minHeight: "100vh", padding: "30px", fontFamily: "Poppins, sans-serif", color: "#144139" }}>
      <h2 style={{ fontSize: "1.8rem", marginBottom: "20px" }}>Shop Profile Setup</h2>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <input type="text" name="shopName" placeholder="Shop Name" value={formData.shopName} onChange={handleChange} required style={inputStyle} />
        <input type="text" name="shopAddress" placeholder="Shop Address" value={formData.shopAddress} onChange={handleChange} required style={inputStyle} />
        <input type="text" name="shopLocation" placeholder="Shop Location (e.g., Lulu Mall, Kochi)" value={formData.shopLocation} onChange={handleChange} required style={inputStyle} />
        <input type="text" name="shopPhoneNumber" placeholder="Shop Phone Number" value={formData.shopPhoneNumber} onChange={handleChange} required style={inputStyle} />
        <select name="shopCategory" value={formData.shopCategory} onChange={handleChange} required style={{ ...inputStyle, padding: "12px" }}>
          <option value="">Select Category</option>
          <option value="Grocery">Grocery</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Bakery">Bakery</option>
          <option value="Stationery">Stationery</option>
          <option value="Salon">Salon</option>
        </select>
        <textarea name="shopDescription" placeholder="Shop Description..." value={formData.shopDescription} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: "none" }} />

        {message && <p style={{ color: message.includes("successfully") ? "green" : "red" }}>{message}</p>}

        <button type="submit" style={submitBtnStyle}>Save and Continue</button>
      </form>

      {/* ✅ Mini map preview (only if coordinates available) */}
      {shopCoords && (
        <div style={{ maxWidth: "600px", margin: "40px auto" }}>
          <h3 style={{ textAlign: "center" }}>Shop Location Preview</h3>
          <MapContainer center={shopCoords} zoom={14} style={{ height: "300px", borderRadius: "10px" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={shopCoords} icon={shopIcon}>
              <Popup>{formData.shopName || "Your Shop Location"}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
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

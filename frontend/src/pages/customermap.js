import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Make sure to import Leaflet's CSS

// --- Define Custom Icons ---
const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Customer location icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png", // Shop icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// --- The Main Map Component ---
const CustomerMap = () => {
  // State for the data we will fetch
  const [customerProfile, setCustomerProfile] = useState(null);
  const [shops, setShops] = useState([]);
  
  // State to manage UI (loading and errors)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // The map's center position. Default to a fallback location (e.g., Thrissur, Kerala).
  const [mapCenter, setMapCenter] = useState([10.5276, 76.2144]);
  const searchRadius = 5; // 5 km radius, matching the backend default

  useEffect(() => {
    // This function will be called once when the component mounts.
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found. Please log in.");
        }

        // --- SINGLE API CALL to the new, unified endpoint ---
        const response = await fetch(
          "https://asia-south1-aroundu-473113.cloudfunctions.net/customer-feed",
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // Handle specific errors from the backend, like 400 or 404
          const errorData = await response.json();
          throw new Error(errorData.msg || `Error: ${response.status}`);
        }

        const data = await response.json();
        
        // --- Process the unified response ---
        setCustomerProfile(data.customerProfile);
        setShops(data.shops || []); // Ensure shops is an array even if it's missing

        // Set the map's center to the customer's saved delivery location
        if (data.customerProfile && data.customerProfile.deliveryLocation) {
          const [lng, lat] = data.customerProfile.deliveryLocation.coordinates;
          setMapCenter([lat, lng]); // Leaflet uses [lat, lng]
        }

      } catch (err) {
        console.error("Failed to fetch customer data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []); // The empty array [] ensures this effect runs only once.

  // --- Render UI based on state ---

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '20%' }}><h2>Loading Map...</h2></div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '20%', color: 'red' }}><h2>Error</h2><p>{error}</p></div>;
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer key={mapCenter.toString()} center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer's Delivery Location Marker */}
        <Marker position={mapCenter} icon={customerIcon}>
          <Popup>📍 Your Saved Delivery Location</Popup>
        </Marker>

        {/* Radius Circle */}
        <Circle
          center={mapCenter}
          radius={searchRadius * 1000} // Radius in meters
          color="#144139"
          fillColor="#C8A46B"
          fillOpacity={0.2}
        />

        {/* Shop Markers */}
        {shops.map((shop) => (
          <Marker
            key={shop._id}
            position={[
              shop.location.coordinates[1], // Latitude
              shop.location.coordinates[0], // Longitude
            ]}
            icon={shopIcon}
          >
            <Popup>
              <b>{shop.name}</b> <br />
              {shop.category} <br />
              📍 {shop.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CustomerMap;

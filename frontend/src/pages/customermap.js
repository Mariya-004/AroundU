import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Define Custom Icons ---
const deliveryIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Saved delivery location icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const liveIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7876/7876209.png", // Blue live location icon
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png", // Shop icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const CustomerMap = () => {
  const [customerProfile, setCustomerProfile] = useState(null);
  const [shops, setShops] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [useLiveLocation, setUseLiveLocation] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.5276, 76.2144]); // Default center (Thrissur)
  const searchRadius = 5; // 5 km radius

  // Fetch saved delivery location + nearby shops initially
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          "https://asia-south1-aroundu-473113.cloudfunctions.net/customer-feed",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || `Error: ${res.status}`);
        }

        const data = await res.json();
        setCustomerProfile(data.customerProfile);
        setShops(data.shops || []);

        if (data.customerProfile?.deliveryLocation?.coordinates) {
          const [lng, lat] = data.customerProfile.deliveryLocation.coordinates;
          setMapCenter([lat, lng]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  // Track live location and optionally fetch nearby shops based on it
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLiveLocation([latitude, longitude]);

          // If live location mode is enabled, fetch nearby shops based on current GPS
          if (useLiveLocation) {
            try {
              const token = localStorage.getItem("token");
              const res = await fetch(
                `https://asia-south1-aroundu-473113.cloudfunctions.net/nearby-shops?lat=${latitude}&lng=${longitude}&radius=5`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const data = await res.json();
              if (data.shops) setShops(data.shops);
              setMapCenter([latitude, longitude]);
            } catch (err) {
              console.error("Error fetching shops by live location:", err);
            }
          }
        },
        (err) => console.warn("Live location denied:", err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );

      // Cleanup on unmount
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.warn("Geolocation not supported");
    }
  }, [useLiveLocation]); // Re-run when toggle changes

  // --- Render UI ---
  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <h2>Loading Map...</h2>
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: "20%", color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* Toggle Button */}
      <button
        onClick={() => setUseLiveLocation(!useLiveLocation)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 9999,
          padding: "10px 15px",
          backgroundColor: useLiveLocation ? "#144139" : "#C8A46B",
          color: useLiveLocation ? "#fff" : "#184C43",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {useLiveLocation ? "📍 Using Live Location" : "🏠 Using Delivery Location"}
      </button>

      {/* Leaflet Map */}
      <MapContainer
        key={mapCenter.toString()}
        center={mapCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Saved Delivery Marker */}
        {customerProfile?.deliveryLocation && (
          <Marker position={mapCenter} icon={deliveryIcon}>
            <Popup>🏠 Your Saved Delivery Location</Popup>
          </Marker>
        )}

        {/* Circle around current view center */}
        <Circle
          center={mapCenter}
          radius={searchRadius * 1000}
          color="#144139"
          fillColor="#C8A46B"
          fillOpacity={0.25}
        />

        {/* Live Location Marker */}
        {liveLocation && (
          <Marker position={liveLocation} icon={liveIcon}>
            <Popup>🟢 You are here (Live)</Popup>
          </Marker>
        )}

        {/* Shop Markers */}
        {shops.map((shop) => (
          <Marker
            key={shop._id}
            position={[
              shop.location.coordinates[1],
              shop.location.coordinates[0],
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

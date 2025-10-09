import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png", // shop / storefront icon
  iconSize: [40, 40],
});

const CustomerMap = () => {
  const [shops, setShops] = useState([]);
  const [position, setPosition] = useState([10.0159, 76.3419]); // Default (Kochi)
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    // Step 1: Get current location (optional)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchShops(latitude, longitude);
      },
      () => fetchShops(position[0], position[1])
    );
  }, []);

  // Step 2: Fetch nearby shops from backend
  const fetchShops = async (lat, lng) => {
    try {
      const token = localStorage.getItem("token"); // JWT from login
      const res = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/nearby-shops?lat=${lat}&lng=${lng}&radius=${radius}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.shops) setShops(data.shops);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={position}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer Marker */}
        <Marker position={position} icon={customerIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Radius Circle */}
        <Circle
          center={position}
          radius={radius * 1000}
          color="#144139"
          fillColor="#C8A46B"
          fillOpacity={0.2}
        />

        {/* Shops Markers */}
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

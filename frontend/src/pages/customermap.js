import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const customerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972106.png",
  iconSize: [40, 40],
});

const CustomerMap = () => {
  const [shops, setShops] = useState([]);
  const [position, setPosition] = useState([10.0159, 76.3419]); // fallback (Kochi)
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    fetchCustomerLocationAndShops();
  }, []);

  const fetchCustomerLocationAndShops = async () => {
    try {
      const token = localStorage.getItem("token");

      // Step 1: Fetch customer's saved delivery location
      const res = await fetch(
        "https://asia-south1-aroundu-473113.cloudfunctions.net/customer-profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Error fetching customer profile:", res.statusText);
        return;
      }

      const data = await res.json();
      console.log("Fetched customer profile:", data);

      if (
        data.deliveryLocation &&
        data.deliveryLocation.coordinates &&
        data.deliveryLocation.coordinates.length === 2
      ) {
        const [lng, lat] = data.deliveryLocation.coordinates;
        setPosition([lat, lng]);
        fetchNearbyShops(lat, lng);
      } else {
        console.warn("No delivery location found for this customer.");
      }
    } catch (err) {
      console.error("Error loading map:", err);
    }
  };

  // Step 2: Fetch nearby shops from backend
  const fetchNearbyShops = async (lat, lng) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/nearby-shops?lat=${lat}&lng=${lng}&radius=${radius}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Error fetching shops:", res.statusText);
        return;
      }

      const data = await res.json();
      if (data.shops) setShops(data.shops);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer Marker */}
        <Marker position={position} icon={customerIcon}>
          <Popup>📍 Your Delivery Location</Popup>
        </Marker>

        {/* Radius Circle */}
        <Circle
          center={position}
          radius={radius * 1000}
          color="#144139"
          fillColor="#C8A46B"
          fillOpacity={0.2}
        />

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

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const primaryColor = "#144139";
const secondaryColor = "#C8A46B";
const neutralBg = "#f9f9f9";
const whiteBg = "#fff";

const API_BASE = "https://asia-south1-aroundu-473113.cloudfunctions.net/get_product";

export default function ShopProductsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/${shopId}/products`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Failed to load products");
        setShop(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [shopId]);

  if (loading)
    return <div style={{ textAlign: "center", marginTop: "20%" }}>Loading...</div>;

  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: "20%", color: "red" }}>
        {error}
      </div>
    );

  return (
    <div
      style={{
        background: neutralBg,
        minHeight: "100vh",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px 30px",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          background: primaryColor,
          color: "#fff",
          border: "none",
          padding: "10px 15px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ← Back
      </button>

      <h2 style={{ color: primaryColor, marginTop: "20px" }}>
        {shop.shopName} — Products
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {shop.products.length === 0 ? (
          <p style={{ color: "#777" }}>No products available.</p>
        ) : (
          shop.products.map((prod) => (
            <div
              key={prod._id}
              onClick={() => navigate(`/product/${prod._id}`)}
              style={{
                background: whiteBg,
                borderRadius: "12px",
                padding: "15px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
            >
              {prod.imageUrl ? (
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    background: "#f0f0f0",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#999",
                    fontWeight: "bold",
                  }}
                >
                  No Image
                </div>
              )}
              <h4 style={{ margin: "10px 0 5px 0", color: primaryColor }}>
                {prod.name}
              </h4>
              <p style={{ margin: 0, color: "#777" }}>{prod.category || "General"}</p>
              <p
                style={{
                  marginTop: "5px",
                  color: secondaryColor,
                  fontWeight: "bold",
                }}
              >
                ₹ {prod.price}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

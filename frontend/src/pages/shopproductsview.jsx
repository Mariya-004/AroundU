import React, { useEffect, useState } from "react";

export default function ShopkeeperProductList() {
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch products from Cloud Function
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage(data.msg || "Failed to fetch products");
        } else {
          setShopInfo({ name: data.shopName, id: data.shopId });
          setProducts(data.products || []);
        }
      } catch (err) {
        setMessage("Server error, please try again later");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading products...</p>;

  return (
    <div
      style={{
        background: "#f9f9f9",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <h2 style={{ color: "#144139", marginBottom: "20px" }}>
        {shopInfo.name ? `${shopInfo.name} - Product List` : "Your Shop Products"}
      </h2>

      {message && (
        <p style={{ color: "red", marginBottom: "20px" }}>{message}</p>
      )}

      {products.length === 0 ? (
        <p>No products added yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {products.map((product) => (
            <div
              key={product._id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    borderRadius: "8px",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                >
                  No image
                </div>
              )}
              <h3 style={{ color: "#144139", fontSize: "1.2rem", marginBottom: "8px" }}>
                {product.name}
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#555" }}>
                {product.description || "No description"}
              </p>
              <p style={{ fontWeight: "600", margin: "8px 0" }}>
                ₹{product.price}
              </p>
              <p style={{ fontSize: "0.9rem", color: "#666" }}>
                Stock: {product.stock}
              </p>

              <button
                onClick={() =>
                  window.location.href = `/edit-product/${shopInfo.id}/${product._id}`
                }
                style={{
                  marginTop: "10px",
                  padding: "10px 15px",
                  background: "#C8A46B",
                  color: "#144139",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Edit Product
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";

export default function ShopkeeperEditProducts() {
  const [products, setProducts] = useState([]);
  const [shopId, setShopId] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");

  // ✅ Fetch all products from the shop_products API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.products) {
          setProducts(data.products);
          setShopId(data.shopId);
        } else {
          setMessage("No products found for this shop.");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setMessage("Failed to load products.");
      }
    };

    fetchProducts();
  }, []);

  // ✅ Handle field changes for editable form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle edit button click
  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  // ✅ Handle save/update
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/edit_products/shops/${shopId}/products/${editingProduct._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingProduct),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);

      // Update product list locally
      setProducts((prev) =>
        prev.map((p) => (p._id === editingProduct._id ? editingProduct : p))
      );
      setMessage("✅ Product updated successfully!");
      setEditingProduct(null);
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ Failed to update product.");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>🛍️ Edit Your Products</h2>

      {message && <p style={styles.message}>{message}</p>}

      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div style={styles.grid}>
          {products.map((product) => (
            <div key={product._id} style={styles.card}>
              {editingProduct && editingProduct._id === product._id ? (
                <>
                  <input
                    type="text"
                    name="name"
                    value={editingProduct.name}
                    onChange={handleChange}
                    style={styles.input}
                  />
                  <textarea
                    name="description"
                    value={editingProduct.description}
                    onChange={handleChange}
                    rows={2}
                    style={styles.input}
                  />
                  <input
                    type="number"
                    name="price"
                    value={editingProduct.price}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    name="stock"
                    value={editingProduct.stock}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Stock"
                  />
                  <input
                    type="text"
                    name="imageUrl"
                    value={editingProduct.imageUrl || ""}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Image URL"
                  />
                  <button onClick={handleSave} style={styles.saveBtn}>💾 Save</button>
                </>
              ) : (
                <>
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/100"}
                    alt={product.name}
                    style={styles.image}
                  />
                  <h4>{product.name}</h4>
                  <p>₹{product.price}</p>
                  <p>Stock: {product.stock}</p>
                  <button onClick={() => handleEdit(product)} style={styles.editBtn}>
                    ✏️ Edit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    fontFamily: "Poppins, sans-serif",
    background: "#f9f9f9",
    minHeight: "100vh",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#144139",
  },
  message: {
    textAlign: "center",
    color: "#006400",
    fontWeight: "500",
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
  },
  card: {
    width: "250px",
    background: "#fff",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  editBtn: {
    background: "#C8A46B",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

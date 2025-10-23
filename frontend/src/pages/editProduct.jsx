import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProduct() {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
  });

  // State for text form
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State for image uploading
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Corrected API base URL
  const imageUploadApiBase =
    "https://asia-south1-aroundu-473113.cloudfunctions.net/updateProductImage";

  // ✅ Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("You must be logged in.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(
          "https://asia-south1-aroundu-473113.cloudfunctions.net/shop_products",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        if (res.ok) {
          const found = data.products?.find(
            (p) => p.id === productId || p._id === productId
          );
          if (found) {
            setProduct(found);
          } else {
            setMessage("Product not found.");
          }
        } else {
          setMessage(data.msg || "Error fetching product details.");
        }
      } catch (err) {
        setMessage("Error fetching product details.");
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [productId]);

  // ✅ Handle text change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadMessage("");
    }
  };

  // ✅ Update text details
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/edit_product/shops/${shopId}/products/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Failed to update product");
      } else {
        setMessage("✅ Product details updated successfully!");
        setTimeout(() => navigate("/shop-products"), 1500);
      }
    } catch (err) {
      setMessage("❌ Server error while updating product details.");
    }
  };

  // ✅ Handle Image Upload
  const handleImageUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Starting upload...");
    const token = localStorage.getItem("token");

    try {
      // Step 1: Get Signed URL
      setUploadMessage("1/3: Getting upload permission...");
      const genUrlRes = await fetch(
        `${imageUploadApiBase}/shops/${shopId}/products/${productId}/generate-upload-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileType: selectedFile.type }),
        }
      );

      let errorData;
      if (!genUrlRes.ok) {
        try {
          errorData = await genUrlRes.json();
        } catch (e) {
          throw new Error(
            `HTTP error ${genUrlRes.status}: Could not get upload URL.`
          );
        }
        throw new Error(errorData.msg || "Could not get upload URL.");
      }

      const { uploadUrl, publicUrl } = await genUrlRes.json();

      // Step 2: Upload File to GCS
      setUploadMessage("2/3: Uploading file...");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadRes.ok) throw new Error("File upload to GCS failed.");

      // Step 3: Save URL to DB
      setUploadMessage("3/3: Saving URL to database...");
      const saveUrlRes = await fetch(
        `${imageUploadApiBase}/shops/${shopId}/products/${productId}/save-image-url`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageUrl: publicUrl }),
        }
      );

      const data = await saveUrlRes.json();
      if (!saveUrlRes.ok)
        throw new Error(data.msg || "Failed to save new image URL.");

      // Success
      setUploadMessage("✅ Image updated successfully!");
      setProduct((prev) => ({ ...prev, imageUrl: publicUrl }));
      setSelectedFile(null);
    } catch (err) {
      setUploadMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div style={styles.container}>Loading product details...</div>;
  }

  return (
    <div style={styles.container}>
      {/* --- Section 1: Text Form --- */}
      <h2 style={styles.title}>Edit Product Details</h2>
      {message && (
        <p
          style={{
            ...styles.message,
            color: message.startsWith("✅") ? "green" : "red",
          }}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleUpdateDetails} style={styles.form}>
        <input
          type="text"
          name="name"
          value={product.name}
          onChange={handleChange}
          placeholder="Product Name"
          required
          style={styles.input}
        />
        <textarea
          name="description"
          value={product.description || ""}
          onChange={handleChange}
          placeholder="Description"
          rows="3"
          style={styles.input}
        />
        <input
          type="number"
          name="price"
          value={product.price}
          onChange={handleChange}
          placeholder="Price"
          required
          step="0.01"
          style={styles.input}
        />
        <input
          type="number"
          name="stock"
          value={product.stock}
          onChange={handleChange}
          placeholder="Stock"
          required
          style={styles.input}
        />

        <button type="submit" style={styles.btn} disabled={isUploading}>
          💾 Update Product Details
        </button>
      </form>

      <hr style={styles.hr} />

      {/* --- Section 2: Image Upload --- */}
      <h2 style={styles.title}>Edit Product Image</h2>

      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          style={styles.imagePreview}
        />
      ) : (
        <p style={styles.label}>No image set for this product.</p>
      )}

      <div style={styles.form}>
        <label style={styles.label}>Upload New Image</label>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          style={styles.input}
          disabled={isUploading}
        />

        <button
          onClick={handleImageUpload}
          style={styles.btnUpload}
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? "Uploading..." : "⬆️ Upload Image"}
        </button>

        {uploadMessage && (
          <p
            style={{
              ...styles.message,
              color: uploadMessage.startsWith("✅") ? "green" : "red",
            }}
          >
            {uploadMessage}
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    maxWidth: "600px",
    margin: "50px auto",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  message: {
    textAlign: "center",
    marginBottom: "10px",
    padding: "10px",
    borderRadius: "8px",
    background: "#f0f0f0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  label: {
    fontSize: "0.9em",
    color: "#555",
    textAlign: "center",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1em",
  },
  btn: {
    padding: "14px",
    background: "#007bff",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1em",
  },
  btnUpload: {
    padding: "14px",
    background: "#28a745",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1em",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #eee",
    margin: "30px 0",
  },
  imagePreview: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "contain",
    borderRadius: "8px",
    marginBottom: "15px",
    border: "1px solid #eee",
  },
};

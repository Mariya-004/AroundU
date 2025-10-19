import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddProduct() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
        setMsg('Please select a product image.');
        return;
    }
    setLoading(true);
    setMsg('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('Unauthorized: Please log in first.');
        setLoading(false);
        return;
      }

      // --- Step 1: Create the product with text data ---
      setMsg('Step 1/4: Creating product...');
      const productData = { name, description, price, stock };
      const addProductRes = await fetch(
        'https://asia-south1-aroundu-473113.cloudfunctions.net/add_product',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(productData),
        }
      );

      const addProductData = await addProductRes.json();

      // ✅ EDITED: Added logging and validation to debug the API response
      console.log('Response from /add_product API:', addProductData);
      
      if (!addProductRes.ok) {
        throw new Error(addProductData.msg || 'Failed to create product');
      }

      // ✅ EDITED: Validate the response structure before destructuring
      if (!addProductData || !addProductData.newProduct || !addProductData.shop) {
        throw new Error('Invalid response structure from the server after creating product.');
      }
      
      const { newProduct, shop } = addProductData;
      const newProductId = newProduct._id;
      const shopId = shop._id;

      // --- Step 2: Get the secure, signed URL for the image upload ---
      setMsg('Step 2/4: Preparing image upload...');
      const generateUrlRes = await fetch(
        `https://asia-south1-aroundu-473113.cloudfunctions.net/updateProductImage/shops/${shopId}/products/${newProductId}/generate-upload-url`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ fileType: imageFile.type })
        }
      );
      const urlData = await generateUrlRes.json();
      if (!generateUrlRes.ok) throw new Error(urlData.msg || 'Could not prepare image upload.');
      
      const { uploadUrl, publicUrl } = urlData;

      // --- Step 3: Upload the image file directly to Google Cloud Storage ---
      setMsg('Step 3/4: Uploading image...');
      const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile
      });
      if (!uploadRes.ok) throw new Error('Image upload to cloud storage failed.');
      
      // --- Step 4: Save the final image URL to the database ---
      setMsg('Step 4/4: Finalizing product...');
      const saveUrlRes = await fetch(
          `https://asia-south1-aroundu-473113.cloudfunctions.net/updateProductImage/shops/${shopId}/products/${newProductId}/save-image-url`,
          {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ imageUrl: publicUrl })
          }
      );
      const finalData = await saveUrlRes.json();
      if (!saveUrlRes.ok) throw new Error(finalData.msg || 'Failed to finalize product.');

      setMsg(`✅ Product "${finalData.product.name}" added successfully!`);
      
      setTimeout(() => navigate('/shopkeeper-dashboard'), 2000);

    } catch (err) {
      setMsg(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: 20, textAlign: 'center' }}>Add a New Product</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        {/* Image Preview and File Input */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <label htmlFor="productImage" style={imageLabelStyle}>
            {imagePreview ? (
              <img src={imagePreview} alt="Product Preview" style={imagePreviewStyle} />
            ) : (
              <span>Click to Select Image</span>
            )}
          </label>
          <input
            type="file"
            id="productImage"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
            required
            style={{ display: 'none' }}
          />
        </div>

        <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{display: 'flex', gap: 16}}>
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required style={inputStyle} min="0" step="0.01" />
          <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} required style={inputStyle} min="0" />
        </div>

        {msg && (
          <p style={{ color: msg.includes('✅') ? 'green' : 'red', textAlign: 'center', fontWeight: '500' }}>
            {msg}
          </p>
        )}

        <button type="submit" disabled={loading} style={buttonStyle(loading)}>
          {loading ? 'Processing...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}

// --- Styles ---
const pageStyle = {
  background: '#f7f7f7',
  minHeight: '100vh',
  padding: '40px 20px',
  color: '#144139',
  fontFamily: 'Poppins, sans-serif',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 500,
  margin: '0 auto',
  background: '#fff',
  padding: '30px',
  borderRadius: '16px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
  gap: 18,
};

const inputStyle = {
  padding: '14px',
  fontSize: '1rem',
  borderRadius: 10,
  border: '1px solid #ddd',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease',
};

const imageLabelStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '150px',
  height: '150px',
  borderRadius: '50%',
  border: '2px dashed #C8A46B',
  cursor: 'pointer',
  margin: '0 auto',
  overflow: 'hidden',
  background: '#fafafa',
  color: '#C8A46B',
  fontWeight: 'bold',
};

const imagePreviewStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const buttonStyle = (loading) => ({
  background: '#C8A46B',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '16px',
  fontWeight: 'bold',
  fontSize: 16,
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
  transition: 'all 0.3s ease',
  marginTop: '10px'
});


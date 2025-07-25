/**
 * EXAMPLE USAGE OF SUPABASE STORAGE WITH PRODUCT IMAGES
 * 
 * This file shows how to use the image upload functionality
 * in your frontend application
 */

// 1. FRONTEND: How to send form data with images to the backend

// Example using JavaScript Fetch API
const uploadProductWithImages = async (productData, mainImage, additionalImages) => {
  const formData = new FormData();
  
  // Add product data
  formData.append('productName', productData.productName);
  formData.append('categoryId', productData.categoryId);
  formData.append('price', productData.price);
  formData.append('quantity', productData.quantity);
  formData.append('unitMeasure', productData.unitMeasure || '');
  formData.append('origin', productData.origin || '');
  formData.append('description', productData.description || '');
  formData.append('isRefundable', productData.isRefundable);
  
  // Add warehouse distribution if provided
  if (productData.warehouseDistribution) {
    formData.append('warehouseDistribution', JSON.stringify(productData.warehouseDistribution));
  }
  
  // Add main image (single file)
  if (mainImage) {
    formData.append('mainImage', mainImage);
  }
  
  // Add additional images (multiple files)
  if (additionalImages && additionalImages.length > 0) {
    additionalImages.forEach(image => {
      formData.append('additionalImages', image);
    });
  }
  
  try {
    const response = await fetch('/api/addProduct', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary for multipart
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Product added successfully:', result);
      return result;
    } else {
      console.error('Error adding product:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// 2. REACT EXAMPLE: Component for product upload with images

/*
import React, { useState } from 'react';

const AddProductForm = () => {
  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    price: '',
    quantity: '',
    unitMeasure: '',
    origin: '',
    description: '',
    isRefundable: false
  });
  
  const [mainImage, setMainImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await uploadProductWithImages(formData, mainImage, additionalImages);
      alert('Product added successfully!');
      // Reset form
      setFormData({
        productName: '',
        categoryId: '',
        price: '',
        quantity: '',
        unitMeasure: '',
        origin: '',
        description: '',
        isRefundable: false
      });
      setMainImage(null);
      setAdditionalImages([]);
    } catch (error) {
      alert('Error adding product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product Name"
        value={formData.productName}
        onChange={(e) => setFormData({...formData, productName: e.target.value})}
        required
      />
      
      <input
        type="number"
        placeholder="Category ID"
        value={formData.categoryId}
        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
        required
      />
      
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: e.target.value})}
        required
      />
      
      <input
        type="number"
        placeholder="Quantity"
        value={formData.quantity}
        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="Unit Measure"
        value={formData.unitMeasure}
        onChange={(e) => setFormData({...formData, unitMeasure: e.target.value})}
      />
      
      <input
        type="text"
        placeholder="Origin"
        value={formData.origin}
        onChange={(e) => setFormData({...formData, origin: e.target.value})}
      />
      
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      
      <label>
        <input
          type="checkbox"
          checked={formData.isRefundable}
          onChange={(e) => setFormData({...formData, isRefundable: e.target.checked})}
        />
        Is Refundable
      </label>
      
      <div>
        <label>Main Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMainImage(e.target.files[0])}
        />
      </div>
      
      <div>
        <label>Additional Images:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setAdditionalImages(Array.from(e.target.files))}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Adding Product...' : 'Add Product'}
      </button>
    </form>
  );
};

export default AddProductForm;
*/

// 3. ENVIRONMENT VARIABLES NEEDED

/*
Add these to your .env file:

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

Make sure to create a storage bucket named 'product-images' in your Supabase dashboard
and set it to public access for the images to be viewable.
*/

// 4. DIRECT USAGE OF SUPABASE STORAGE FUNCTIONS

/*
import { uploadImageToSupabase, deleteImageFromSupabase } from './utils/supabaseStorage.js';

// Upload single image
const uploadSingle = async (fileBuffer, fileName) => {
  const result = await uploadImageToSupabase(fileBuffer, fileName);
  if (result.success) {
    console.log('Image uploaded:', result.url);
  } else {
    console.error('Upload failed:', result.error);
  }
};

// Delete image
const deleteImage = async (fileName) => {
  const result = await deleteImageFromSupabase(fileName);
  if (result.success) {
    console.log('Image deleted successfully');
  } else {
    console.error('Delete failed:', result.error);
  }
};
*/

export { uploadProductWithImages };

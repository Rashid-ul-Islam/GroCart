import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/SideBar.jsx'; // Adjust the import path as necessary

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const categoryId = searchParams.get('categoryId');
  const categoryName = searchParams.get('categoryName');

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
      setSelectedCategory({ category_id: categoryId, category_name: categoryName });
    }
  }, [categoryId, categoryName]);

  const fetchProductsByCategory = async (catId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/productsByCat/getProductsByCategory/${catId}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleCategorySelect = (category, hasChildren) => {
    if (!hasChildren) {
      // Update URL and fetch products for the new category
      window.history.pushState(
        null, 
        '', 
        `/products/category?categoryId=${category.category_id}&categoryName=${encodeURIComponent(category.category_name)}`
      );
      fetchProductsByCategory(category.category_id);
      setSelectedCategory(category);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onCategorySelect={handleCategorySelect}
        onSidebarToggle={handleSidebarToggle}
      />
      
      <div className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-16' : 'ml-80'
      } flex-1 p-6`}>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedCategory ? selectedCategory.category_name : 'Products'}
          </h1>
          <p className="text-gray-600 mt-1">
            {products.length} products found
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.product_name}
                  </h3>
                  <p className="text-lg font-bold text-blue-600">
                    ${product.price}
                  </p>
                  {product.original_price && product.original_price > product.price && (
                    <p className="text-sm text-gray-500 line-through">
                      ${product.original_price}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Products Found */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;

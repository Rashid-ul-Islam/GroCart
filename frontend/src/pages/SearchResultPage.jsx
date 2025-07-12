import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/SideBar.jsx';
import { Search, Filter } from 'lucide-react';
import {useAuth} from '../context/AuthContext.jsx';

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const searchQuery = searchParams.get('query');

  useEffect(() => {
    if (searchQuery) {
      searchProducts(searchQuery);
    }
  }, [searchQuery]);

  const searchProducts = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/search/searchProducts?query=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || data);
        setTotalResults(data.totalResults || data.length);
      } else {
        console.error('Failed to search products:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to search products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleCategorySelect = (category, hasChildren) => {
    if (!hasChildren) {
      const categoryName = category.category_name || 'Unknown Category';
      window.location.href = `/products/category?categoryId=${category.category_id}&categoryName=${encodeURIComponent(categoryName)}`;
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
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-gray-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results for "{searchQuery}"
            </h1>
          </div>
          <p className="text-gray-600">
            {loading ? 'Searching...' : `${totalResults} products found`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Search Results */}
        {!loading && (
          <>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map((product) => (
                  <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-200 flex items-center justify-center">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name || product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.product_name || product.name}
                      </h3>
                      <p className="text-lg font-bold text-purple-600">
                        ${product.price}
                      </p>
                      {product.origin && (
                        <p className="text-sm text-gray-500 mt-1">
                          Origin: {product.origin}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_available ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  Try searching with different keywords or browse our categories.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResultsPage;

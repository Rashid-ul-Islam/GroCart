import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Star, Filter, ArrowRight } from 'lucide-react';

// Mock data for demonstration - in real implementation, this would come from your API
const mockProducts = [
  { id: 1, name: 'Fresh Organic Apples', category: 'Fruits', price: 4.99, rating: 4.5, popularity: 95, description: 'Crisp and sweet organic apples from local farms' },
  { id: 2, name: 'Banana Bundle', category: 'Fruits', price: 2.49, rating: 4.2, popularity: 88, description: 'Fresh yellow bananas perfect for smoothies' },
  { id: 3, name: 'Milk Whole Organic', category: 'Dairy', price: 3.79, rating: 4.7, popularity: 92, description: 'Farm fresh organic whole milk' },
  { id: 4, name: 'Chicken Breast', category: 'Meat', price: 8.99, rating: 4.4, popularity: 78, description: 'Premium quality chicken breast' },
  { id: 5, name: 'Tomatoes Cherry', category: 'Vegetables', price: 3.29, rating: 4.3, popularity: 85, description: 'Sweet cherry tomatoes perfect for salads' },
  { id: 6, name: 'Bread Whole Wheat', category: 'Bakery', price: 2.99, rating: 4.1, popularity: 73, description: 'Healthy whole wheat bread' },
  { id: 7, name: 'Yogurt Greek Plain', category: 'Dairy', price: 4.49, rating: 4.6, popularity: 89, description: 'Creamy Greek yogurt with probiotics' },
  { id: 8, name: 'Spinach Fresh', category: 'Vegetables', price: 2.79, rating: 4.4, popularity: 67, description: 'Fresh leafy spinach rich in iron' },
  { id: 9, name: 'Salmon Fillet', category: 'Seafood', price: 12.99, rating: 4.8, popularity: 91, description: 'Wild-caught salmon fillet' },
  { id: 10, name: 'Avocado Hass', category: 'Fruits', price: 1.99, rating: 4.5, popularity: 94, description: 'Creamy Hass avocados perfect for toast' }
];

const mockCategories = ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Bakery'];

const mockSearchHistory = [
  'organic apples', 'fresh milk', 'chicken breast', 'greek yogurt', 'salmon'
];

const mockTrendingSearches = [
  'organic vegetables', 'fresh fruits', 'dairy products', 'healthy snacks', 'protein foods'
];

// Utility functions for search processing
const removeStopwords = (text) => {
  const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
  return text.toLowerCase().split(' ').filter(word => !stopwords.includes(word)).join(' ');
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

const calculateBM25Score = (query, product) => {
  const k1 = 1.2;
  const b = 0.75;
  const avgDocLength = 50;
  
  const queryTerms = query.toLowerCase().split(' ');
  const doc = `${product.name} ${product.description} ${product.category}`.toLowerCase();
  const docTerms = doc.split(' ');
  const docLength = docTerms.length;
  
  let score = 0;
  queryTerms.forEach(term => {
    const termFreq = docTerms.filter(t => t.includes(term)).length;
    if (termFreq > 0) {
      const idf = Math.log(mockProducts.length / (mockProducts.filter(p => 
        `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term)
      ).length + 1));
      
      score += idf * (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (docLength / avgDocLength)));
    }
  });
  
  return score;
};

const fuzzySearch = (query, products) => {
  const processedQuery = removeStopwords(query);
  const queryTerms = processedQuery.toLowerCase().split(' ');
  
  return products.map(product => {
    const productText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    
    // Exact match score
    let exactScore = 0;
    if (productText.includes(query.toLowerCase())) {
      exactScore = 10;
    }
    
    // BM25 score
    const bm25Score = calculateBM25Score(query, product);
    
    // Fuzzy match score
    let fuzzyScore = 0;
    queryTerms.forEach(term => {
      const words = productText.split(' ');
      words.forEach(word => {
        const distance = levenshteinDistance(term, word);
        if (distance <= 2) {
          fuzzyScore += (3 - distance) * 2;
        }
      });
    });
    
    // Popularity and rating boost
    const popularityBoost = (product.popularity / 100) * 5;
    const ratingBoost = (product.rating / 5) * 3;
    
    const totalScore = exactScore + bm25Score + fuzzyScore + popularityBoost + ratingBoost;
    
    return {
      ...product,
      score: totalScore,
      relevance: totalScore > 0 ? 'high' : 'low'
    };
  }).filter(product => product.score > 0)
    .sort((a, b) => b.score - a.score);
};

const generateNgrams = (text, n = 2) => {
  const ngrams = [];
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.push(text.substring(i, i + n));
  }
  return ngrams;
};

const getAutocompletesuggestions = (query, products) => {
  if (!query || query.length < 2) return [];
  
  const suggestions = new Set();
  const queryLower = query.toLowerCase();
  
  // Add exact matches and prefix matches
  products.forEach(product => {
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    
    if (name.startsWith(queryLower)) {
      suggestions.add(product.name);
    }
    if (category.startsWith(queryLower)) {
      suggestions.add(product.category);
    }
    
    // Add partial matches
    if (name.includes(queryLower)) {
      suggestions.add(product.name);
    }
  });
  
  // Add fuzzy suggestions
  products.forEach(product => {
    const words = product.name.toLowerCase().split(' ');
    words.forEach(word => {
      if (levenshteinDistance(queryLower, word) <= 1 && word.length > 2) {
        suggestions.add(product.name);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 8);
};

const EcommerceSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState(mockSearchHistory);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    rating: ''
  });
  
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (query) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (query.length >= 2) {
            const autocompleteSuggestions = getAutocompletesuggestions(query, mockProducts);
            setSuggestions(autocompleteSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }, 300);
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    // Add to search history
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    
    // Perform search
    setTimeout(() => {
      const results = fuzzySearch(query, mockProducts);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 500);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestion(-1);
    
    if (!value.trim()) {
      setShowSuggestions(false);
      setShowResults(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion >= 0) {
        const selected = suggestions[selectedSuggestion];
        setSearchQuery(selected);
        handleSearch(selected);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          🛒 GroCart Search
        </h1>
        <p className="text-gray-600 text-center">Find your favorite products with our intelligent search</p>
      </div>

      {/* Search Container */}
      <div ref={searchRef} className="relative mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchQuery.length >= 2) setShowSuggestions(true);
            }}
            placeholder="Search for products, categories, or brands..."
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto"
          >
            {/* Search History */}
            {searchQuery.length < 2 && searchHistory.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Searches
                </h3>
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-purple-50 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Trending Searches */}
            {searchQuery.length < 2 && (
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </h3>
                {mockTrendingSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-purple-50 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-600 mb-2 px-2">
                  Suggestions
                </h3>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 flex items-center justify-between ${
                      selectedSuggestion === index 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center">
                      <Search className="h-4 w-4 mr-3 text-gray-400" />
                      {suggestion}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Categories */}
            {searchQuery.length >= 2 && (
              <div className="p-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {mockCategories
                    .filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((category, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(category)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Button */}
      <div className="text-center mb-6">
        <button
          onClick={() => handleSearch()}
          disabled={!searchQuery.trim() || isSearching}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg transform hover:scale-105"
        >
          {isSearching ? 'Searching...' : 'Search Products'}
        </button>
      </div>

      {/* Filters */}
      {showResults && (
        <div className="mb-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">All Categories</option>
              {mockCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 mt-4">Searching for the best products...</p>
        </div>
      )}

      {/* Search Results */}
      {showResults && !isSearching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Search Results ({searchResults.length})
            </h2>
            <div className="text-sm text-gray-600">
              Query: "{searchQuery}"
            </div>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">Try different keywords or check your spelling</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Suggestions:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {mockTrendingSearches.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group">
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-50">
                        {product.category === 'Fruits' && '🍎'}
                        {product.category === 'Vegetables' && '🥬'}
                        {product.category === 'Dairy' && '🥛'}
                        {product.category === 'Meat' && '🥩'}
                        {product.category === 'Seafood' && '🐟'}
                        {product.category === 'Bakery' && '🍞'}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium text-purple-700">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-purple-700 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.popularity}% popular
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-700">
                        ${product.price}
                      </span>
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                        Add to Cart
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Relevance Score: {product.score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EcommerceSearch;
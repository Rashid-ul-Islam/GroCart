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
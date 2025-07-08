import pool from "../db.js";

// Enhanced search controller with advanced features
export class EnhancedSearchController {

    // Spell correction using Levenshtein distance
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;

        for (let i = 0; i <= len2; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len1; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len2; i++) {
            for (let j = 1; j <= len1; j++) {
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

        return matrix[len2][len1];
    }

    // Enhanced query expansion with better category and keyword mapping
    static expandQuery(query) {
        const categoryKeywords = {
            'fruits': ['apple', 'banana', 'orange', 'grape', 'mango', 'strawberry', 'pineapple', 'watermelon', 'kiwi', 'peach', 'pear', 'plum', 'cherry', 'lemon', 'lime', 'coconut', 'papaya', 'guava', 'pomegranate', 'avocado', 'fresh fruit', 'organic fruit', 'seasonal fruit', 'tropical fruit', 'citrus fruit'],
            'vegetables': ['carrot', 'tomato', 'potato', 'onion', 'garlic', 'ginger', 'broccoli', 'cauliflower', 'cabbage', 'spinach', 'lettuce', 'cucumber', 'bell pepper', 'chili', 'eggplant', 'okra', 'peas', 'beans', 'corn', 'mushroom', 'fresh vegetable', 'organic vegetable', 'leafy greens', 'root vegetable'],
            'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'paneer', 'curd', 'ice cream', 'ghee', 'condensed milk', 'powdered milk', 'fresh milk', 'organic milk', 'low fat milk', 'whole milk', 'skim milk'],
            'meat': ['chicken', 'beef', 'mutton', 'pork', 'fish', 'prawns', 'crab', 'lamb', 'goat', 'turkey', 'bacon', 'ham', 'sausage', 'fresh meat', 'frozen meat', 'organic meat', 'lean meat'],
            'beverages': ['juice', 'water', 'soda', 'tea', 'coffee', 'energy drink', 'soft drink', 'mineral water', 'coconut water', 'fresh juice', 'cold drink', 'hot beverage'],
            'snacks': ['chips', 'biscuits', 'cookies', 'crackers', 'nuts', 'popcorn', 'chocolate', 'candy', 'namkeen', 'dry fruits', 'healthy snacks'],
            'grains': ['rice', 'wheat', 'flour', 'bread', 'pasta', 'noodles', 'cereal', 'oats', 'quinoa', 'barley', 'whole grain', 'basmati rice', 'brown rice'],
            'spices': ['salt', 'pepper', 'turmeric', 'cumin', 'coriander', 'cardamom', 'cinnamon', 'cloves', 'bay leaves', 'mustard seeds', 'fenugreek', 'red chili powder', 'garam masala'],
            'household': ['detergent', 'soap', 'shampoo', 'toothpaste', 'tissue', 'toilet paper', 'cleaning supplies', 'air freshener', 'dishwash', 'floor cleaner'],
            'personal care': ['soap', 'shampoo', 'conditioner', 'toothpaste', 'toothbrush', 'face wash', 'moisturizer', 'sunscreen', 'deodorant', 'perfume'],
            'electronics': ['phone', 'laptop', 'tablet', 'headphones', 'charger', 'speaker', 'camera', 'television', 'refrigerator', 'washing machine', 'air conditioner', 'microwave'],
            'clothing': ['shirt', 'pants', 'dress', 'shoes', 'sandals', 'jacket', 'sweater', 't-shirt', 'jeans', 'ethnic wear', 'formal wear', 'casual wear'],
            'baby care': ['baby food', 'diapers', 'baby oil', 'baby shampoo', 'baby powder', 'baby clothes', 'toys', 'feeding bottle'],
            'health': ['medicine', 'vitamins', 'supplements', 'first aid', 'thermometer', 'bandage', 'antiseptic', 'health drinks'],
            'frozen': ['frozen vegetables', 'frozen meat', 'frozen fruits', 'ice cream', 'frozen food', 'ready to eat']
        };

        const synonyms = {
            'phone': ['mobile', 'smartphone', 'cell phone', 'handset', 'cellular'],
            'laptop': ['notebook', 'computer', 'PC', 'desktop'],
            'tv': ['television', 'smart tv', 'LED TV', 'LCD TV'],
            'fridge': ['refrigerator', 'freezer', 'cooling'],
            'milk': ['dairy', 'fresh milk', 'whole milk', 'low fat milk'],
            'meat': ['protein', 'non-veg', 'chicken', 'beef', 'mutton'],
            'vegetables': ['veggies', 'greens', 'produce', 'fresh vegetables'],
            'fruits': ['fresh fruits', 'seasonal fruits', 'organic fruits'],
            'cheap': ['budget', 'affordable', 'low price', 'discount'],
            'expensive': ['premium', 'luxury', 'high quality', 'costly'],
            'organic': ['natural', 'chemical free', 'eco-friendly', 'healthy'],
            'fresh': ['new', 'recently harvested', 'crisp'],
            'spicy': ['hot', 'chili', 'pepper', 'masala'],
            'sweet': ['sugar', 'dessert', 'candy', 'chocolate'],
            'healthy': ['nutritious', 'organic', 'natural', 'diet'],
            'baby': ['infant', 'newborn', 'child', 'kids'],
            'cleaning': ['washing', 'sanitizing', 'disinfecting', 'hygiene']
        };

        const brandMapping = {
            'apple': ['iPhone', 'iPad', 'MacBook', 'Apple'],
            'samsung': ['Galaxy', 'Samsung'],
            'sony': ['PlayStation', 'Sony'],
            'lg': ['LG Electronics'],
            'nestle': ['Maggi', 'Nestlé', 'Nescafe'],
            'hindustan unilever': ['HUL', 'Dove', 'Lux', 'Surf'],
            'procter gamble': ['P&G', 'Gillette', 'Head & Shoulders'],
            'coca cola': ['Coke', 'Sprite', 'Fanta'],
            'pepsi': ['Pepsi', '7UP', 'Mountain Dew'],
            'amul': ['Amul', 'dairy products'],
            'britannia': ['Britannia', 'Good Day', 'Tiger'],
            'parle': ['Parle-G', 'Monaco', 'Krackjack']
        };

        let expandedTerms = [query.toLowerCase()];
        const queryLower = query.toLowerCase();

        // Add category-specific keywords
        Object.keys(categoryKeywords).forEach(category => {
            if (queryLower.includes(category)) {
                expandedTerms = expandedTerms.concat(categoryKeywords[category]);
            }
            // Also check if query contains any keywords from this category
            categoryKeywords[category].forEach(keyword => {
                if (queryLower.includes(keyword)) {
                    expandedTerms.push(category);
                    expandedTerms = expandedTerms.concat(categoryKeywords[category].slice(0, 5)); // Add related keywords
                }
            });
        });

        // Add synonyms
        Object.keys(synonyms).forEach(key => {
            if (queryLower.includes(key)) {
                expandedTerms = expandedTerms.concat(synonyms[key]);
            }
        });

        // Add brand mappings
        Object.keys(brandMapping).forEach(brand => {
            if (queryLower.includes(brand)) {
                expandedTerms = expandedTerms.concat(brandMapping[brand]);
            }
        });

        return [...new Set(expandedTerms)]; // Remove duplicates
    }

    // Enhanced spell correction for search queries
    static async correctSpelling(query) {
        try {
            // Get comprehensive dictionary from database
            const commonTermsQuery = `
                SELECT DISTINCT word FROM (
                    SELECT UNNEST(string_to_array(lower(name), ' ')) as word
                    FROM "Product" 
                    WHERE is_available = true
                    UNION
                    SELECT UNNEST(string_to_array(lower(name), ' ')) as word
                    FROM "Category"
                    UNION
                    SELECT UNNEST(string_to_array(lower(description), ' ')) as word
                    FROM "Product" 
                    WHERE description IS NOT NULL AND is_available = true
                    UNION
                    SELECT UNNEST(string_to_array(lower(origin), ' ')) as word
                    FROM "Product" 
                    WHERE origin IS NOT NULL AND is_available = true
                ) words
                WHERE length(word) > 2 AND word ~ '^[a-zA-Z]+$'
                ORDER BY word;
            `;

            const { rows } = await pool.query(commonTermsQuery);
            const dictionary = [...new Set(rows.map(row => row.word))];

            const words = query.toLowerCase().split(' ');
            const correctedWords = words.map(word => {
                if (word.length < 3) return word;

                let bestMatch = word;
                let minDistance = Infinity;

                dictionary.forEach(dictWord => {
                    const distance = this.levenshteinDistance(word, dictWord);
                    if (distance < minDistance && distance <= 2) {
                        minDistance = distance;
                        bestMatch = dictWord;
                    }
                });

                return bestMatch;
            });

            return correctedWords.join(' ');
        } catch (error) {
            console.error('Spell correction error:', error);
            return query;
        }
    }

    // Enhanced search with NLP features
    static async enhancedSearch(req, res) {
        const { query, filters = {}, sort = 'relevance', page = 1, limit = 20 } = req.query;
        const userId = req.user?.user_id;
        const offset = (page - 1) * limit;

        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        try {
            // Save search history
            if (userId) {
                await EnhancedSearchController.saveSearchHistory(userId, query);
            }

            // Spell correction
            const correctedQuery = await EnhancedSearchController.correctSpelling(query);

            // Query expansion
            const expandedTerms = EnhancedSearchController.expandQuery(correctedQuery);

            // Build comprehensive search conditions with weighted relevance
            const searchConditions = expandedTerms.map((term, index) => {
                const paramNum = index + 1;
                return `
                    (
                        p.name ILIKE $${paramNum} OR
                        p.name ILIKE '%' || $${paramNum} || '%' OR
                        c.name ILIKE $${paramNum} OR
                        c.name ILIKE '%' || $${paramNum} || '%' OR
                        parent_cat.name ILIKE $${paramNum} OR
                        parent_cat.name ILIKE '%' || $${paramNum} || '%' OR
                        COALESCE(p.description, '') ILIKE '%' || $${paramNum} || '%' OR
                        COALESCE(p.origin, '') ILIKE '%' || $${paramNum} || '%' OR
                        COALESCE(p.unit_measure, '') ILIKE '%' || $${paramNum} || '%'
                    )
                `;
            }).join(' OR ');

            // Build filter conditions
            let filterConditions = '';
            let paramIndex = expandedTerms.length + 1;
            const queryParams = [...expandedTerms]; // Don't escape here, let PostgreSQL handle it

            if (filters.category) {
                filterConditions += ` AND c.category_id = $${paramIndex}`;
                queryParams.push(filters.category);
                paramIndex++;
            }

            if (filters.minPrice) {
                filterConditions += ` AND p.price >= $${paramIndex}`;
                queryParams.push(filters.minPrice);
                paramIndex++;
            }

            if (filters.maxPrice) {
                filterConditions += ` AND p.price <= $${paramIndex}`;
                queryParams.push(filters.maxPrice);
                paramIndex++;
            }

            if (filters.inStock) {
                filterConditions += ` AND p.quantity > 0`;
            }

            // Build sorting with enhanced relevance
            let orderBy = '';
            switch (sort) {
                case 'price_asc':
                    orderBy = 'p.price ASC, relevance_score DESC';
                    break;
                case 'price_desc':
                    orderBy = 'p.price DESC, relevance_score DESC';
                    break;
                case 'name':
                    orderBy = 'p.name ASC, relevance_score DESC';
                    break;
                case 'newest':
                    orderBy = 'p.created_at DESC, relevance_score DESC';
                    break;
                case 'rating':
                    orderBy = 'COALESCE(AVG(r.rating), 0) DESC, relevance_score DESC';
                    break;
                default: // relevance
                    orderBy = 'relevance_score DESC, COALESCE(AVG(r.rating), 0) DESC, p.name ASC';
            }

            // Enhanced main search query with comprehensive matching
            const searchQuery = `
                SELECT
                    p.product_id,
                    p.name AS product_name,
                    p.price,
                    p.quantity,
                    p.unit_measure,
                    p.origin,
                    p.description,
                    p.is_refundable,
                    p.is_available,
                    p.created_at,
                    p.updated_at,
                    pi.image_url,
                    pi.is_primary,
                    c.name AS category_name,
                    c.category_id,
                    parent_cat.name AS parent_category_name,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.review_id) as review_count,
                    COALESCE(i.quantity_in_stock, 0) as stock_quantity,
                    -- Enhanced relevance scoring
                    (
                        CASE 
                            WHEN p.name ILIKE $1 THEN 1000
                            WHEN p.name ILIKE '%' || $1 || '%' THEN 800
                            WHEN c.name ILIKE $1 THEN 700
                            WHEN c.name ILIKE '%' || $1 || '%' THEN 600
                            WHEN parent_cat.name ILIKE $1 THEN 500
                            WHEN parent_cat.name ILIKE '%' || $1 || '%' THEN 400
                            WHEN p.description ILIKE '%' || $1 || '%' THEN 300
                            WHEN p.origin ILIKE '%' || $1 || '%' THEN 200
                            WHEN p.unit_measure ILIKE '%' || $1 || '%' THEN 100
                            ELSE 50
                        END +
                        -- Boost for exact matches
                        CASE 
                            WHEN LOWER(p.name) = LOWER($1) THEN 500
                            WHEN LOWER(c.name) = LOWER($1) THEN 400
                            WHEN LOWER(parent_cat.name) = LOWER($1) THEN 300
                            ELSE 0
                        END +
                        -- Boost for availability and stock
                        CASE 
                            WHEN p.is_available = true AND p.quantity > 0 THEN 100
                            WHEN p.is_available = true THEN 50
                            ELSE 0
                        END +
                        -- Boost for ratings
                        COALESCE(AVG(r.rating), 0) * 20
                    ) as relevance_score
                FROM "Product" p
                LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
                LEFT JOIN "Category" c ON p.category_id = c.category_id
                LEFT JOIN "Category" parent_cat ON c.parent_id = parent_cat.category_id
                LEFT JOIN "Review" r ON p.product_id = r.product_id
                LEFT JOIN "Inventory" i ON p.product_id = i.product_id
                WHERE p.is_available = true
                    AND (${searchConditions})
                    ${filterConditions}
                GROUP BY p.product_id, pi.image_url, pi.is_primary, c.name, c.category_id, parent_cat.name, i.quantity_in_stock
                ORDER BY ${orderBy}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
            `;

            // Add limit and offset to query parameters
            queryParams.push(limit, offset);

            // Get total count with enhanced search
            const countQuery = `
                SELECT COUNT(DISTINCT p.product_id) as total
                FROM "Product" p
                LEFT JOIN "Category" c ON p.category_id = c.category_id
                LEFT JOIN "Category" parent_cat ON c.parent_id = parent_cat.category_id
                WHERE p.is_available = true
                    AND (${searchConditions})
                    ${filterConditions};
            `;

            // Build count parameters (only expanded terms + filters, no limit/offset)
            const countParams = [...expandedTerms];
            if (filters.category) countParams.push(filters.category);
            if (filters.minPrice) countParams.push(filters.minPrice);
            if (filters.maxPrice) countParams.push(filters.maxPrice);

            const [searchResult, countResult] = await Promise.all([
                pool.query(searchQuery, queryParams),
                pool.query(countQuery, countParams)
            ]);

            let products = searchResult.rows;
            let total = parseInt(countResult.rows[0].total);

            // Fallback search if no results found with expanded terms
            if (products.length === 0 && expandedTerms.length > 1) {
                console.log('No results with expanded terms, trying original query...');

                const fallbackSearchConditions = `
                    (
                        p.name ILIKE $1 OR
                        p.name ILIKE '%' || $1 || '%' OR
                        c.name ILIKE $1 OR
                        c.name ILIKE '%' || $1 || '%' OR
                        parent_cat.name ILIKE $1 OR
                        parent_cat.name ILIKE '%' || $1 || '%' OR
                        COALESCE(p.description, '') ILIKE '%' || $1 || '%'
                    )
                `;

                const fallbackQuery = `
                    SELECT
                        p.product_id,
                        p.name AS product_name,
                        p.price,
                        p.quantity,
                        p.unit_measure,
                        p.origin,
                        p.description,
                        p.is_refundable,
                        p.is_available,
                        p.created_at,
                        p.updated_at,
                        pi.image_url,
                        pi.is_primary,
                        c.name AS category_name,
                        c.category_id,
                        parent_cat.name AS parent_category_name,
                        COALESCE(AVG(r.rating), 0) as avg_rating,
                        COUNT(r.review_id) as review_count,
                        COALESCE(i.quantity_in_stock, 0) as stock_quantity,
                        (
                            CASE 
                                WHEN p.name ILIKE '%' || $1 || '%' THEN 1000
                                WHEN c.name ILIKE '%' || $1 || '%' THEN 700
                                WHEN parent_cat.name ILIKE '%' || $1 || '%' THEN 500
                                WHEN p.description ILIKE '%' || $1 || '%' THEN 300
                                WHEN LOWER(p.name) = LOWER($1) THEN 500
                                WHEN LOWER(c.name) = LOWER($1) THEN 400
                                ELSE 50
                            END
                        ) as relevance_score
                    FROM "Product" p
                    LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
                    LEFT JOIN "Category" c ON p.category_id = c.category_id
                    LEFT JOIN "Category" parent_cat ON c.parent_id = parent_cat.category_id
                    LEFT JOIN "Review" r ON p.product_id = r.product_id
                    LEFT JOIN "Inventory" i ON p.product_id = i.product_id
                    WHERE p.is_available = true
                        AND (${fallbackSearchConditions})
                        ${filterConditions}
                    GROUP BY p.product_id, pi.image_url, pi.is_primary, c.name, c.category_id, parent_cat.name, i.quantity_in_stock
                    ORDER BY relevance_score DESC, COALESCE(AVG(r.rating), 0) DESC, p.name ASC
                    LIMIT $2 OFFSET $3;
                `;

                const fallbackParams = [correctedQuery, limit, offset];
                if (filters.category) fallbackParams.push(filters.category);
                if (filters.minPrice) fallbackParams.push(filters.minPrice);
                if (filters.maxPrice) fallbackParams.push(filters.maxPrice);

                const fallbackResult = await pool.query(fallbackQuery, fallbackParams);
                products = fallbackResult.rows;

                // Update count for fallback
                if (products.length > 0) {
                    const fallbackCountQuery = `
                        SELECT COUNT(DISTINCT p.product_id) as total
                        FROM "Product" p
                        LEFT JOIN "Category" c ON p.category_id = c.category_id
                        LEFT JOIN "Category" parent_cat ON c.parent_id = parent_cat.category_id
                        WHERE p.is_available = true
                            AND (${fallbackSearchConditions})
                            ${filterConditions};
                    `;
                    const fallbackCountParams = [correctedQuery];
                    if (filters.category) fallbackCountParams.push(filters.category);
                    if (filters.minPrice) fallbackCountParams.push(filters.minPrice);
                    if (filters.maxPrice) fallbackCountParams.push(filters.maxPrice);

                    const fallbackCountResult = await pool.query(fallbackCountQuery, fallbackCountParams);
                    total = parseInt(fallbackCountResult.rows[0].total);
                }
            }

            // Get suggestions if no results
            let suggestions = [];
            if (products.length === 0) {
                suggestions = await EnhancedSearchController.getSuggestions(query);
            }

            // Get trending products and popular searches
            const [trendingProducts, popularSearches] = await Promise.all([
                EnhancedSearchController.getTrendingProducts(5),
                EnhancedSearchController.getPopularSearches(5)
            ]);

            return res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    },
                    query: {
                        original: query,
                        corrected: correctedQuery,
                        expanded: expandedTerms
                    },
                    suggestions,
                    trending: trendingProducts,
                    popular_searches: popularSearches
                }
            });

        } catch (error) {
            console.error('Enhanced search error:', error);
            return res.status(500).json({
                success: false,
                message: 'Search failed',
                error: error.message
            });
        }
    }

    // Get autocomplete suggestions
    static async getAutocomplete(req, res) {
        const { query, limit = 10 } = req.query;
        const userId = req.user?.user_id;

        if (!query || query.trim() === '') {
            return res.json({ success: true, suggestions: [] });
        }

        try {
            // Product name suggestions
            const productSuggestions = await pool.query(`
                SELECT name as suggestion, 'product' as type, product_id as id
                FROM "Product"
                WHERE name ILIKE $1 AND is_available = true
                ORDER BY name
                LIMIT $2;
            `, [`${query}%`, Math.floor(limit / 2)]);

            // Category suggestions
            const categorySuggestions = await pool.query(`
                SELECT name as suggestion, 'category' as type, category_id as id
                FROM "Category"
                WHERE name ILIKE $1
                ORDER BY name
                LIMIT $2;
            `, [`${query}%`, Math.floor(limit / 4)]);

            // Popular searches
            const popularSuggestions = await pool.query(`
                SELECT search_query as suggestion, 'popular' as type, NULL as id
                FROM "SearchHistory"
                WHERE search_query ILIKE $1
                GROUP BY search_query
                ORDER BY COUNT(*) DESC
                LIMIT $2;
            `, [`${query}%`, Math.floor(limit / 4)]);

            const suggestions = [
                ...productSuggestions.rows,
                ...categorySuggestions.rows,
                ...popularSuggestions.rows
            ].slice(0, limit);

            return res.json({
                success: true,
                suggestions: suggestions
            });

        } catch (error) {
            console.error('Autocomplete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Autocomplete failed',
                error: error.message
            });
        }
    }

    // Save search history
    static async saveSearchHistory(userId, query) {
        try {
            await pool.query(`
                INSERT INTO "SearchHistory" (user_id, search_query, search_date)
                VALUES ($1, $2, NOW());
            `, [userId, query]);
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Enhanced search suggestions when no results found
    static async getSuggestions(query) {
        try {
            // Get suggestions based on partial matches and popular items
            const suggestions = await pool.query(`
                SELECT DISTINCT suggestion_text, suggestion_type, match_score FROM (
                    -- Product name suggestions
                    SELECT 
                        p.name as suggestion_text,
                        'product' as suggestion_type,
                        CASE 
                            WHEN LOWER(p.name) = LOWER($1) THEN 100
                            WHEN p.name ILIKE $1 || '%' THEN 90
                            WHEN p.name ILIKE '%' || $1 || '%' THEN 80
                            ELSE 60
                        END as match_score
                    FROM "Product" p
                    WHERE p.is_available = true
                        AND p.name ILIKE '%' || $1 || '%'
                    
                    UNION ALL
                    
                    -- Category suggestions
                    SELECT 
                        c.name as suggestion_text,
                        'category' as suggestion_type,
                        CASE 
                            WHEN LOWER(c.name) = LOWER($1) THEN 95
                            WHEN c.name ILIKE $1 || '%' THEN 85
                            WHEN c.name ILIKE '%' || $1 || '%' THEN 75
                            ELSE 50
                        END as match_score
                    FROM "Category" c
                    WHERE c.name ILIKE '%' || $1 || '%'
                    
                    UNION ALL
                    
                    -- Popular search suggestions
                    SELECT 
                        sh.search_query as suggestion_text,
                        'popular_search' as suggestion_type,
                        60 as match_score
                    FROM "SearchHistory" sh
                    WHERE sh.search_query ILIKE '%' || $1 || '%'
                        AND sh.search_date >= NOW() - INTERVAL '30 days'
                    GROUP BY sh.search_query
                    HAVING COUNT(*) > 1
                ) suggestions
                ORDER BY match_score DESC, suggestion_text ASC
                LIMIT 10;
            `, [query]);

            return suggestions.rows.map(row => ({
                text: row.suggestion_text,
                type: row.suggestion_type,
                score: row.match_score
            }));
        } catch (error) {
            console.error('Error getting suggestions:', error);
            // Fallback to simple suggestions
            try {
                const fallbackSuggestions = await pool.query(`
                    SELECT p.name as suggestion_text, 'product' as suggestion_type
                    FROM "Product" p
                    WHERE p.is_available = true
                    ORDER BY RANDOM()
                    LIMIT 5;
                `);
                return fallbackSuggestions.rows.map(row => ({
                    text: row.suggestion_text,
                    type: row.suggestion_type,
                    score: 50
                }));
            } catch (fallbackError) {
                console.error('Fallback suggestions error:', fallbackError);
                return [];
            }
        }
    }

    // Get trending products
    static async getTrendingProducts(limit = 10) {
        try {
            const trending = await pool.query(`
                SELECT 
                    p.product_id,
                    p.name,
                    p.price,
                    pi.image_url,
                    COUNT(oi.product_id) as order_count
                FROM "Product" p
                LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
                LEFT JOIN "OrderItem" oi ON p.product_id = oi.product_id
                LEFT JOIN "Order" o ON oi.order_id = o.order_id
                WHERE p.is_available = true
                    AND o.order_date >= NOW() - INTERVAL '30 days'
                GROUP BY p.product_id, p.name, p.price, pi.image_url
                ORDER BY order_count DESC
                LIMIT $1;
            `, [limit]);

            return trending.rows;
        } catch (error) {
            console.error('Error getting trending products:', error);
            return [];
        }
    }

    // Get popular searches
    static async getPopularSearches(limit = 10) {
        try {
            const popular = await pool.query(`
                SELECT 
                    search_query,
                    COUNT(*) as search_count
                FROM "SearchHistory"
                WHERE search_date >= NOW() - INTERVAL '7 days'
                GROUP BY search_query
                ORDER BY search_count DESC
                LIMIT $1;
            `, [limit]);

            return popular.rows;
        } catch (error) {
            console.error('Error getting popular searches:', error);
            return [];
        }
    }

    // Get personalized recommendations
    static async getPersonalizedRecommendations(req, res) {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        try {
            // Get user's purchase history and preferences
            const recommendations = await pool.query(`
                WITH user_preferences AS (
                    SELECT 
                        p.category_id,
                        COUNT(*) as category_count,
                        AVG(p.price) as avg_price
                    FROM "OrderItem" oi
                    JOIN "Order" o ON oi.order_id = o.order_id
                    JOIN "Product" p ON oi.product_id = p.product_id
                    WHERE o.user_id = $1
                    GROUP BY p.category_id
                    ORDER BY category_count DESC
                    LIMIT 3
                ),
                user_searches AS (
                    SELECT search_query
                    FROM "SearchHistory"
                    WHERE user_id = $1
                    ORDER BY search_date DESC
                    LIMIT 10
                )
                SELECT DISTINCT
                    p.product_id,
                    p.name,
                    p.price,
                    p.category_id,
                    pi.image_url,
                    c.name as category_name,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.review_id) as review_count,
                    CASE 
                        WHEN up.category_id IS NOT NULL THEN up.category_count * 2
                        ELSE 1
                    END as preference_score
                FROM "Product" p
                LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
                LEFT JOIN "Category" c ON p.category_id = c.category_id
                LEFT JOIN "Review" r ON p.product_id = r.product_id
                LEFT JOIN user_preferences up ON p.category_id = up.category_id
                WHERE p.is_available = true
                    AND p.product_id NOT IN (
                        SELECT DISTINCT oi.product_id
                        FROM "OrderItem" oi
                        JOIN "Order" o ON oi.order_id = o.order_id
                        WHERE o.user_id = $1
                    )
                GROUP BY p.product_id, p.name, p.price, p.category_id, pi.image_url, c.name, up.category_count
                ORDER BY preference_score DESC, COALESCE(AVG(r.rating), 0) DESC
                LIMIT $2;
            `, [userId, limit]);

            return res.json({
                success: true,
                recommendations: recommendations.rows
            });

        } catch (error) {
            console.error('Personalized recommendations error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get recommendations',
                error: error.message
            });
        }
    }
}

// Export individual functions for backward compatibility
export const searchProducts = EnhancedSearchController.enhancedSearch;
export const getAutocomplete = EnhancedSearchController.getAutocomplete;
export const getPersonalizedRecommendations = EnhancedSearchController.getPersonalizedRecommendations;
export const saveSearchHistory = async (req, res) => {
    const { user_id, search_query } = req.body;

    try {
        await EnhancedSearchController.saveSearchHistory(user_id, search_query);
        res.json({ success: true, message: 'Search history saved' });
    } catch (error) {
        console.error('Error saving search history:', error);
        res.status(500).json({ success: false, message: 'Failed to save search history' });
    }
};

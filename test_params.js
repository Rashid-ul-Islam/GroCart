// Test to verify parameter handling in enhanced search
import { EnhancedSearchController } from './backend/controllers/enhancedSearchController.js';

console.log('Testing parameter handling...');

// Test query expansion
const testQuery = 'fruits';
const expandedTerms = EnhancedSearchController.expandQuery(testQuery);

console.log(`Original query: "${testQuery}"`);
console.log(`Expanded terms (${expandedTerms.length}):`, expandedTerms.slice(0, 10));

// Simulate parameter building
const queryParams = [...expandedTerms];
let paramIndex = expandedTerms.length + 1;

// Simulate filters
const filters = { category: null, minPrice: null, maxPrice: null };

if (filters.category) {
    queryParams.push(filters.category);
    paramIndex++;
}
if (filters.minPrice) {
    queryParams.push(filters.minPrice);
    paramIndex++;
}
if (filters.maxPrice) {
    queryParams.push(filters.maxPrice);
    paramIndex++;
}

// Add limit and offset
const limit = 20, offset = 0;
queryParams.push(limit, offset);

console.log(`\nParameter Analysis:`);
console.log(`- Expanded terms: ${expandedTerms.length}`);
console.log(`- Filter params: ${paramIndex - expandedTerms.length - 1}`);
console.log(`- Total params (with limit/offset): ${queryParams.length}`);
console.log(`- Expected LIMIT param index: $${paramIndex}`);
console.log(`- Expected OFFSET param index: $${paramIndex + 1}`);

// Test count params
const countParams = [...expandedTerms];
if (filters.category) countParams.push(filters.category);
if (filters.minPrice) countParams.push(filters.minPrice);
if (filters.maxPrice) countParams.push(filters.maxPrice);

console.log(`\nCount Query Parameters:`);
console.log(`- Count params length: ${countParams.length}`);
console.log(`- Should match expanded terms + filters: ${expandedTerms.length + (filters.category ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)}`);

console.log('\n✅ Parameter handling verification complete!');

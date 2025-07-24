import { getDeliveryStats, getRecentOrders } from './controllers/deliveryOverviewController.js';

// Mock request and response objects
const mockReq = {
    query: {}
};

const mockRes = {
    json: (data) => {
        console.log('Response:', JSON.stringify(data, null, 2));
    },
    status: (code) => ({
        json: (data) => {
            console.log(`Status ${code}:`, JSON.stringify(data, null, 2));
        }
    })
};

console.log('Testing getDeliveryStats...');
try {
    await getDeliveryStats(mockReq, mockRes);
} catch (error) {
    console.error('Error testing getDeliveryStats:', error.message);
}

console.log('\nTesting getRecentOrders...');
try {
    await getRecentOrders(mockReq, mockRes);
} catch (error) {
    console.error('Error testing getRecentOrders:', error.message);
}

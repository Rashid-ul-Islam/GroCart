// This file is no longer needed
// Stock cleanup is now handled directly in the frontend when users:
// 1. Leave the checkout page
// 2. Complete their order
// 3. Go back in the checkout process

// For emergency situations, admin can use:
// GET /api/stock/stuck - to see products with buying_in_progress > 0
// POST /api/stock/reset-stuck - to reset all buying_in_progress to 0

export default () => {
    console.log('Stock cleanup scheduler is disabled - using frontend-based stock management');
};

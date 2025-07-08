import express from 'express';
import {
  searchProducts as basicSearch,
  saveSearchHistory as basicSaveHistory,
  getUserSearchHistory
} from '../controllers/searchController.js';

import {
  searchProducts as enhancedSearch,
  getAutocomplete,
  getPersonalizedRecommendations,
  saveSearchHistory as enhancedSaveHistory
} from '../controllers/enhancedSearchController.js';

const router = express.Router();

// Enhanced search endpoints
router.get('/enhanced-search', enhancedSearch);
router.get('/autocomplete', getAutocomplete);
router.get('/recommendations/:userId', getPersonalizedRecommendations);
router.post('/save-search', enhancedSaveHistory);

// Legacy endpoints (backward compatibility)
router.get('/searchProducts', basicSearch);
router.post('/saveSearchHistory', basicSaveHistory);
router.get('/getUserSearchHistory/:userId', getUserSearchHistory);

export default router;

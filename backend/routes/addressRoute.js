import express from 'express';
import {
  // Division operations
  getDivisions,
  getDivisionById,
  createDivision,
  updateDivision,
  deleteDivision,
  
  // District operations
  getDistricts,
  getDistrictsByDivision,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  
  // City operations
  getCities,
  getCitiesByDistrict,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  
  // Delivery Region operations
  getDeliveryRegions,
  getDeliveryRegionById,
  createDeliveryRegion,
  updateDeliveryRegion,
  deleteDeliveryRegion,
  
  // Region operations
  getRegions,
  getRegionsByCity,
  getRegionsWithDeliveryInfo,
  getRegionById,
  createRegion,
  updateRegion,
  updateRegionDeliveryRegion,
  deleteRegion,
  
  // Search operations
  searchDeliveryRegions,
  searchRegions,
  
  // Utility operations
  getAddressHierarchy,
  getWarehouses
} from '../controllers/addressController.js';

const router = express.Router();

// Division routes
router.get('/divisions', getDivisions);
router.get('/divisions/:id', getDivisionById);
router.post('/divisions', createDivision);
router.put('/divisions/:id', updateDivision);
router.delete('/divisions/:id', deleteDivision);

// District routes
router.get('/districts', getDistricts);
router.get('/districts/:division_id', getDistrictsByDivision);
router.get('/district/:id', getDistrictById);
router.post('/districts', createDistrict);
router.put('/districts/:id', updateDistrict);
router.delete('/districts/:id', deleteDistrict);

// City routes
router.get('/cities', getCities);
router.get('/cities/:district_id', getCitiesByDistrict);
router.get('/city/:id', getCityById);
router.post('/cities', createCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

// Delivery Region routes
router.get('/delivery-regions', getDeliveryRegions);
router.get('/delivery-regions/:id', getDeliveryRegionById);
router.post('/delivery-regions', createDeliveryRegion);
router.put('/delivery-regions/:id', updateDeliveryRegion);
router.delete('/delivery-regions/:id', deleteDeliveryRegion);

// Region routes
router.get('/regions', getRegions);
router.get('/regions/:city_id', getRegionsByCity);
router.get('/regions-with-delivery', getRegionsWithDeliveryInfo);
router.get('/region/:id', getRegionById);
router.post('/regions', createRegion);
router.put('/regions/:id', updateRegion);
router.put('/regions/:id/delivery-region', updateRegionDeliveryRegion);
router.delete('/regions/:id', deleteRegion);

// Search routes
router.get('/search-delivery-regions', searchDeliveryRegions);
router.get('/search-regions', searchRegions);

// Hierarchy routes
router.get('/address-hierarchy/:region_id', getAddressHierarchy);
router.get('/warehouses', getWarehouses);

export default router;

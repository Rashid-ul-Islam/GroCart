import express from 'express';
import malfunctionedDeliveryController from '../controllers/malfunctionedDeliveryController.js';

const router = express.Router();

// Get all malfunctioned deliveries
router.get('/', malfunctionedDeliveryController.getMalfunctionedDeliveries);

// Get delivery details by ID
router.get('/:deliveryId', malfunctionedDeliveryController.getDeliveryDetails);

// Cancel delivery
router.patch('/:deliveryId/cancel', malfunctionedDeliveryController.cancelDelivery);

// Reassign delivery to new delivery boy
router.patch('/:deliveryId/reassign', malfunctionedDeliveryController.reassignDelivery);

// Get available delivery boys for reassignment
router.get('/available/delivery-boys', malfunctionedDeliveryController.getAvailableDeliveryBoys);

export default router;

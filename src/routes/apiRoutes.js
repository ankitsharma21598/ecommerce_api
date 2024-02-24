const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/categories', apiController.getCategories);
router.get('/products', apiController.getProducts);
router.get('/products/:productId', apiController.getProductById);
router.post('/users/register', apiController.registerUser);
router.post('/users/login', apiController.loginUser);

// Protected routes
router.get('/cart', authMiddleware.verifyToken, apiController.viewCart);
router.post('/cart/add', authMiddleware.verifyToken, apiController.addToCart);
router.patch('/cart/update', authMiddleware.verifyToken, apiController.updateCart);
router.delete('/cart/remove/:cartId', authMiddleware.verifyToken, apiController.removeFromCart);
router.post('/orders/place', authMiddleware.verifyToken, apiController.placeOrder);
router.get('/orders/history', authMiddleware.verifyToken, apiController.getOrderHistory);
router.get('/orders/:orderId', authMiddleware.verifyToken, apiController.getOrderById);

module.exports = router;

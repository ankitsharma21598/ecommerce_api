// Import necessary modules and database functions
const db = require('../models/database');
const jwt = require('jsonwebtoken');

// Controller functions
exports.getCategories = (req, res) => {
    db.query('SELECT * FROM categories')
        .then(result => {
            const categories = result.rows;
            res.status(200).json(categories);
        })
        .catch(error => {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

exports.getProducts = (req, res) => {
    const categoryId = parseInt(req.query.categoryId);
    
    // Check if categoryId is a valid number
    if (isNaN(categoryId)) {
        return res.status(400).json({ error: 'Invalid categoryId' });
    }

    db.query('SELECT * FROM products WHERE category_id = $1', [categoryId])
        .then(result => {
            const products = result.rows;
            res.status(200).json(products);
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

exports.getProductById = (req, res) => {
    const productId = parseInt(req.params.productId);
    
    // Check if productId is a valid number
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid productId' });
    }

    db.query('SELECT * FROM products WHERE product_id = $1', [productId])
        .then(result => {
            const product = result.rows[0]; // Extract the first row
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
            } else {
                res.status(200).json(product);
            }
        })
        .catch(error => {
            console.error('Error fetching product by ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};


exports.addToCart = (req, res) => {
    const userId = req.userId;
    const { productId, quantity } = req.body;
    
    // Check if userId, productId, and quantity are provided and valid
    if (!userId || isNaN(userId) || !productId || isNaN(productId) || !quantity || isNaN(quantity)) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    // Assuming you have a 'cart' table with columns 'user_id', 'product_id', and 'quantity'
    db.query('INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)', [userId, productId, quantity])
        .then(() => {
            res.status(201).json({ message: 'Product added to cart successfully' });
        })
        .catch(error => {
            console.error('Error adding product to cart:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

exports.viewCart = (req, res) => {
    const userId = req.userId; // Assuming userId is obtained from authentication middleware
    
    // Check if userId is provided and valid
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid userId' });
    }

    db.query('SELECT * FROM cart WHERE user_id = $1', [userId])
        .then(cartItems => {
            res.status(200).json(cartItems.rows); // Extract rows from result
        })
        .catch(error => {
            console.error('Error retrieving user cart:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};


exports.updateCart = (req, res) => {
    const userId = req.userId; // Assuming userId is obtained from authentication middleware
    const { quantity } = req.body;
    
    // Check if userId, productId, and quantity are provided and valid
    if (!userId || isNaN(userId) || !quantity || isNaN(quantity)) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    db.query('UPDATE cart SET quantity = $1 WHERE user_id = $2', [quantity, userId])
        .then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Cart item not found' });
            } else {
                res.status(200).json({ message: 'Cart item updated successfully' });
            }
        })
        .catch(error => {
            console.error('Error updating cart item:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};


exports.removeFromCart = (req, res) => {
    const userId = req.userId; // Assuming userId is obtained from authentication middleware
    const cartId = req.params.cartId;
    
    // Check if userId and cartId are provided and valid
    if (!userId || isNaN(userId) || !cartId || isNaN(cartId)) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    db.query('DELETE FROM cart WHERE user_id = $1 AND cart_id = $2', [userId, cartId])
        .then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Cart item not found' });
            } else {
                res.status(200).json({ message: 'Product removed from cart successfully' });
            }
        })
        .catch(error => {
            console.error('Error removing product from cart:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

// placeOrder function
exports.placeOrder = (req, res) => {
    const userId = req.userId; // Assuming userId is obtained from authentication middleware

    // Fetch cart items for the user with product information
    db.query('SELECT cart.*, products.price FROM cart JOIN products ON cart.product_id = products.product_id WHERE cart.user_id = $1', [userId])
        .then(cartItems => {
            // If the cart is empty, return an error
            if (cartItems.rows.length === 0) {
                return res.status(400).json({ error: 'Cart is empty. Please add items to the cart before placing an order.' });
            }

            // Calculate total amount and prepare order items
            let totalAmount = 0;
            const orderItems = cartItems.rows.map(item => {
                totalAmount += item.price * item.quantity;
                return {
                    product_id: item.product_id,
                    quantity: item.quantity
                };
            });

            // Start a transaction
            db.query('BEGIN')
                .then(() => {
                    // Insert the order into the orders table
                    return db.query('INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING order_id', [userId, totalAmount])
                        .then(order => {
                            const orderId = order.rows[0].order_id;
                            // Insert order items into the order_items table
                            const insertQueries = orderItems.map(item => {
                                return db.query('INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)', [orderId, item.product_id, item.quantity]);
                            });
                            return Promise.all(insertQueries);
                        })
                        .then(() => {
                            // Clear the user's cart after placing the order
                            return db.query('DELETE FROM cart WHERE user_id = $1', [userId]);
                        });
                })
                .then(() => {
                    // Commit the transaction if all queries succeed
                    return db.query('COMMIT');
                })
                .then(() => {
                    res.status(201).json({ message: 'Order placed successfully' });
                })
                .catch(error => {
                    // Rollback the transaction if any query fails
                    console.error('Error placing order:', error);
                    db.query('ROLLBACK').then(() => {
                        res.status(500).json({ error: 'Internal server error' });
                    });
                });
        })
        .catch(error => {
            console.error('Error fetching cart items:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

// getOrderHistory function
exports.getOrderHistory = (req, res) => {
    const userId = req.userId; // Assuming userId is obtained from authentication middleware

    // Fetch order history for the user
    db.query('SELECT * FROM orders WHERE user_id = $1', [userId])
        .then(orders => {
            // If no orders found for the user, return an empty array
            if (orders.rows.length === 0) {
                return res.json([]);
            }

            const orderIds = orders.rows.map(order => order.order_id);
            // Fetch order items for each order
            Promise.all(orderIds.map(orderId =>
                db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId])
            ))
            .then(orderItemsResults => {
                // Map order items to their respective orders
                const ordersWithItems = orders.rows.map((order, index) => ({
                    ...order,
                    orderItems: orderItemsResults[index].rows
                }));
                res.json(ordersWithItems);
            })
            .catch(error => {
                console.error('Error retrieving order items:', error);
                res.status(500).json({ error: 'Internal server error' });
            });
        })
        .catch(error => {
            console.error('Error retrieving order history:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

// getOrderById function
exports.getOrderById = (req, res) => {
    const userId = req.userId; // Assuming userId is obtained from authentication middleware
    const orderId = req.params.orderId;

    // Fetch the order by order ID and user ID
    db.query('SELECT * FROM orders WHERE user_id = $1 AND order_id = $2', [userId, orderId])
        .then(order => {
            if (order.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Fetch order items for the order
            db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId])
                .then(orderItems => {
                    const orderDetails = {
                        order: order.rows[0],
                        orderItems: orderItems.rows
                    };
                    res.json(orderDetails);
                })
                .catch(error => {
                    console.error('Error retrieving order items:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch(error => {
            console.error('Error retrieving order by ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
};

exports.registerUser = (req, res) => {
    const { username, email, password } = req.body;
    // Check if user with the same email already exists
    db.query('SELECT * FROM users WHERE email = $1', [email])
    .then(result => {
        const existingUser = result.rows[0];
        if (existingUser) {
            res.status(400).json({ error: 'User with this email already exists' });
        } else {
            // Insert new user into the database
            db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, password])
                .then(() => {
                    res.status(201).json({ message: 'User registered successfully' });
                })
                .catch(error => {
                    console.error('Error registering user:', error);
                    res.status(500).json({ error: 'Internal server error' });
                });
        }
    })
    .catch(error => {
        console.error('Error checking existing user:', error);
        res.status(500).json({ error: 'Internal server error' });
    });

};

exports.loginUser = (req, res) => {
    const { email, password } = req.body;
    // Check if user with the provided email exists
    db.query('SELECT * FROM users WHERE email = $1', [email])
    .then(result => {
        const user = result.rows[0];
        if (!user || user.password !== password) {
            res.status(401).json({ error: 'Invalid email or password' });
        } else {
            // Generate JWT token
            const token = jwt.sign({ userId: user.user_id, email: user.email }, 'secret123', { expiresIn: '1d' });
            res.status(200).json({ message: 'Login successful', token });
        }
    })
    .catch(error => {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error' });
    });
};

module.exports = exports;

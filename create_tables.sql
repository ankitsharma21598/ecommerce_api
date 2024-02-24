-- Create the tables in the newly created database
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Create the products table
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Create the users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create the cart table
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create the order items table
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Insert the products data
-- INSERT INTO products (title, price, description, availability, category_id)
-- VALUES
--   ('Iphone 15 pro max', 149000.99, 'The iPhone 15 Pro Max display has rounded corners that follows a beautiful curved design, and these corners are within a standard rectangle.', true, 1),
--   ('Levis jeans', 1599.99, 'A modern slim with room to move; the 511™ Slim Fit Jean has added stretch for all-day comfort. It offers a lean look and is a great alternative to skinny jeans.', true, 2),
--   ('Rich Dad Poor Dad Book', 200.99, 'Rich Dad Poor Dad is a 1997 book written by Robert T. Kiyosaki and Sharon Lechter. It advocates the importance of financial literacy.', true, 3),
--   ('Lg Refrigerator', 25.99, 'Side by Side Frost Free Refrigerator: Premium Refrigerators with auto-defrost function to prevent ice build-up', false, 4);


-- Insert some categories 
-- INSERT INTO categories (name)
-- VALUES
--   ('Electronics'),
--   ('Clothing'),
--   ('Books'),
--   ('Home & Kitchen');

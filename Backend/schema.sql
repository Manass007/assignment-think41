CREATE TABLE distribution_centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    created_at TIMESTAMP,
    sold_at TIMESTAMP,
    cost NUMERIC,
    product_category VARCHAR(255),
    product_name VARCHAR(255),
    product_brand VARCHAR(255),
    product_retail_price NUMERIC,
    product_department VARCHAR(255),
    product_sku VARCHAR(255),
    product_distribution_center_id INTEGER
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    user_id INTEGER,
    product_id INTEGER,
    inventory_item_id INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    returned_at TIMESTAMP
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    status VARCHAR(50),
    gender VARCHAR(20),
    created_at TIMESTAMP,
    returned_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    num_of_item INTEGER
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    cost NUMERIC,
    category VARCHAR(255),
    name VARCHAR(255),
    brand VARCHAR(255),
    retail_price NUMERIC,
    department VARCHAR(255),
    sku VARCHAR(255),
    distribution_center_id INTEGER
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    age INTEGER,
    gender VARCHAR(20),
    state VARCHAR(100),
    street_address VARCHAR(255),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    traffic_source VARCHAR(100),
    created_at TIMESTAMP
);
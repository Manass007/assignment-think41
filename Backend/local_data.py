import pandas as pd
import psycopg2

# Database connection parameters
DB_NAME = "ecommerce"
DB_USER = "postgres"
DB_PASSWORD = "admin"  # <-- Replace with your actual password
DB_HOST = "localhost"
DB_PORT = "5432"

# Paths to CSV files (adjust if needed)
DATASET_PATH = "archive/"
CSV_FILES = {
    "distribution_centers": DATASET_PATH + "distribution_centers.csv",
    "inventory_items": DATASET_PATH + "inventory_items.csv",
    "order_items": DATASET_PATH + "order_items.csv",
    "orders": DATASET_PATH + "orders.csv",
    "products": DATASET_PATH + "products.csv",
    "users": DATASET_PATH + "users.csv",
}

def insert_distribution_centers(cur, df):
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO distribution_centers (id, name, latitude, longitude)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (row['id'], row['name'], row['latitude'], row['longitude']))

def insert_inventory_items(cur, df):
    for _, row in df.iterrows():
        # Convert NaN to None for timestamp columns
        created_at = row['created_at'] if pd.notnull(row['created_at']) else None
        sold_at = row['sold_at'] if pd.notnull(row['sold_at']) else None
        cur.execute("""
            INSERT INTO inventory_items (
                id, product_id, created_at, sold_at, cost,
                product_category, product_name, product_brand,
                product_retail_price, product_department, product_sku,
                product_distribution_center_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            row['id'], row['product_id'], created_at, sold_at, row['cost'],
            row['product_category'], row['product_name'], row['product_brand'],
            row['product_retail_price'], row['product_department'], row['product_sku'],
            row['product_distribution_center_id']
        ))

def insert_order_items(cur, df):
    for _, row in df.iterrows():
        created_at = row['created_at'] if pd.notnull(row['created_at']) else None
        shipped_at = row['shipped_at'] if pd.notnull(row['shipped_at']) else None
        delivered_at = row['delivered_at'] if pd.notnull(row['delivered_at']) else None
        returned_at = row['returned_at'] if pd.notnull(row['returned_at']) else None
        cur.execute("""
            INSERT INTO order_items (
                id, order_id, user_id, product_id, inventory_item_id,
                status, created_at, shipped_at, delivered_at, returned_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            row['id'], row['order_id'], row['user_id'], row['product_id'], row['inventory_item_id'],
            row['status'], created_at, shipped_at, delivered_at, returned_at
        ))

def insert_orders(cur, df):
    for _, row in df.iterrows():
        created_at = row['created_at'] if pd.notnull(row['created_at']) else None
        returned_at = row['returned_at'] if pd.notnull(row['returned_at']) else None
        shipped_at = row['shipped_at'] if pd.notnull(row['shipped_at']) else None
        delivered_at = row['delivered_at'] if pd.notnull(row['delivered_at']) else None
        cur.execute("""
            INSERT INTO orders (
                order_id, user_id, status, gender, created_at,
                returned_at, shipped_at, delivered_at, num_of_item
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (order_id) DO NOTHING
        """, (
            row['order_id'], row['user_id'], row['status'], row['gender'], created_at,
            returned_at, shipped_at, delivered_at, row['num_of_item']
        ))

def insert_products(cur, df):
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO products (
                id, cost, category, name, brand,
                retail_price, department, sku, distribution_center_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            row['id'], row['cost'], row['category'], row['name'], row['brand'],
            row['retail_price'], row['department'], row['sku'], row['distribution_center_id']
        ))

def insert_users(cur, df):
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO users (
                id, first_name, last_name, email, age, gender, state,
                street_address, postal_code, city, country, latitude,
                longitude, traffic_source, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        """, (
            row['id'], row['first_name'], row['last_name'], row['email'], row['age'], row['gender'], row['state'],
            row['street_address'], row['postal_code'], row['city'], row['country'], row['latitude'],
            row['longitude'], row['traffic_source'], row['created_at']
        ))

def main():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()

    # Insert data in order to satisfy foreign key dependencies
    print("Inserting distribution_centers...")
    df = pd.read_csv(CSV_FILES["distribution_centers"])
    insert_distribution_centers(cur, df)
    conn.commit()

    print("Inserting products...")
    df = pd.read_csv(CSV_FILES["products"])
    insert_products(cur, df)
    conn.commit()

    print("Inserting users...")
    df = pd.read_csv(CSV_FILES["users"])
    insert_users(cur, df)
    conn.commit()

    print("Inserting inventory_items...")
    df = pd.read_csv(CSV_FILES["inventory_items"])
    insert_inventory_items(cur, df)
    conn.commit()

    print("Inserting orders...")
    df = pd.read_csv(CSV_FILES["orders"])
    insert_orders(cur, df)
    conn.commit()

    print("Inserting order_items...")
    df = pd.read_csv(CSV_FILES["order_items"])
    insert_order_items(cur, df)
    conn.commit()

    cur.close()
    conn.close()
    print("All data inserted successfully.")

if __name__ == "__main__":
    main()
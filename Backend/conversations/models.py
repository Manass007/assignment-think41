from django.db import models
from django.contrib.auth.models import User

# --- Conversation Models (already present) ---
class ConversationSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Session {self.id} for {self.user.username}"

class Message(models.Model):
    SESSION_SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SESSION_SENDER_CHOICES)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} at {self.timestamp}: {self.text[:30]}"

# --- E-commerce Models (from schema.sql) ---
class DistributionCenter(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()

    class Meta:
        managed = False
        db_table = 'distribution_centers'

class Product(models.Model):
    id = models.AutoField(primary_key=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=255)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2)
    department = models.CharField(max_length=255)
    sku = models.CharField(max_length=255)
    distribution_center_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'products'

class InventoryItem(models.Model):
    id = models.AutoField(primary_key=True)
    product_id = models.IntegerField()
    created_at = models.DateTimeField(null=True, blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    product_category = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255)
    product_brand = models.CharField(max_length=255)
    product_retail_price = models.DecimalField(max_digits=10, decimal_places=2)
    product_department = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=255)
    product_distribution_center_id = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'inventory_items'

class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()
    status = models.CharField(max_length=50)
    gender = models.CharField(max_length=20)
    created_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    num_of_item = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'orders'

class OrderItem(models.Model):
    id = models.AutoField(primary_key=True)
    order_id = models.IntegerField()
    user_id = models.IntegerField()
    product_id = models.IntegerField()
    inventory_item_id = models.IntegerField()
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'order_items'

class EcommerceUser(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    state = models.CharField(max_length=100)
    street_address = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    traffic_source = models.CharField(max_length=100)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'users'
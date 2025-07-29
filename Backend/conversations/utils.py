import re
from typing import List, Dict, Any, Optional
from django.db.models import Q, Count, Avg
from datetime import datetime, timedelta
from django.utils import timezone

def extract_price_from_text(text: str) -> Dict[str, float]:
    """Extract price information from user text"""
    price_info = {}
    text_lower = text.lower()
    
    # Pattern for "under $X", "below $X", etc.
    max_price_patterns = [
        r'under\s*\$?(\d+(?:\.\d{2})?)',
        r'below\s*\$?(\d+(?:\.\d{2})?)',
        r'less than\s*\$?(\d+(?:\.\d{2})?)',
        r'cheaper than\s*\$?(\d+(?:\.\d{2})?)',
        r'max\s*\$?(\d+(?:\.\d{2})?)',
        r'maximum\s*\$?(\d+(?:\.\d{2})?)'
    ]
    
    # Pattern for "over $X", "above $X", etc.
    min_price_patterns = [
        r'over\s*\$?(\d+(?:\.\d{2})?)',
        r'above\s*\$?(\d+(?:\.\d{2})?)',
        r'more than\s*\$?(\d+(?:\.\d{2})?)',
        r'at least\s*\$?(\d+(?:\.\d{2})?)',
        r'min\s*\$?(\d+(?:\.\d{2})?)',
        r'minimum\s*\$?(\d+(?:\.\d{2})?)'
    ]
    
    # Extract max price
    for pattern in max_price_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                price_info['max_price'] = float(match.group(1))
                break
            except ValueError:
                pass
    
    # Extract min price
    for pattern in min_price_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                price_info['min_price'] = float(match.group(1))
                break
            except ValueError:
                pass
    
    # Pattern for price range like "$20-$50" or "$20 to $50"
    range_patterns = [
        r'\$?(\d+(?:\.\d{2})?)\s*[-to]\s*\$?(\d+(?:\.\d{2})?)',
        r'between\s*\$?(\d+(?:\.\d{2})?)\s*and\s*\$?(\d+(?:\.\d{2})?)'
    ]
    
    for pattern in range_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                price1 = float(match.group(1))
                price2 = float(match.group(2))
                price_info['min_price'] = min(price1, price2)
                price_info['max_price'] = max(price1, price2)
                break
            except ValueError:
                pass
    
    return price_info

def get_seasonal_recommendations(season: str = None) -> List[str]:
    """Get product categories appropriate for the season"""
    current_month = datetime.now().month
    
    if not season:
        # Auto-detect season based on current month
        if current_month in [12, 1, 2]:
            season = 'winter'
        elif current_month in [3, 4, 5]:
            season = 'spring'
        elif current_month in [6, 7, 8]:
            season = 'summer'
        else:
            season = 'fall'
    
    seasonal_categories = {
        'winter': [
            'Sweaters', 'Outerwear & Coats', 'Fashion Hoodies & Sweatshirts',
            'Pants', 'Jeans', 'Socks & Hosiery'
        ],
        'spring': [
            'Tops & Tees', 'Light Jackets', 'Dresses', 'Skirts',
            'Shorts', 'Blazers & Jackets'
        ],
        'summer': [
            'Swim', 'Shorts', 'Tops & Tees', 'Dresses',
            'Accessories', 'Sleep & Lounge'
        ],
        'fall': [
            'Sweaters', 'Jeans', 'Blazers & Jackets', 'Pants',
            'Outerwear & Coats', 'Fashion Hoodies & Sweatshirts'
        ]
    }
    
    return seasonal_categories.get(season.lower(), seasonal_categories['summer'])

def analyze_user_style_preferences(user_orders: List[Dict]) -> Dict[str, Any]:
    """Analyze user's past orders to determine style preferences"""
    if not user_orders:
        return {'style': 'unknown', 'preferences': {}}
    
    # Count categories
    category_counts = {}
    brand_counts = {}
    price_sum = 0
    price_count = 0
    
    for order in user_orders:
        category = order.get('category', '')
        brand = order.get('brand', '')
        price = order.get('price', 0)
        
        if category:
            category_counts[category] = category_counts.get(category, 0) + 1
        if brand:
            brand_counts[brand] = brand_counts.get(brand, 0) + 1
        if price:
            price_sum += float(price)
            price_count += 1
    
    # Determine style based on category preferences
    top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    top_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)
    
    style = 'casual'  # default
    if top_categories:
        top_category = top_categories[0][0]
        if 'Active' in top_category:
            style = 'athletic'
        elif any(formal in top_category for formal in ['Suits', 'Blazers', 'Business']):
            style = 'formal'
        elif 'Dresses' in top_category:
            style = 'feminine'
        elif any(casual in top_category for casual in ['Jeans', 'Tops & Tees', 'Shorts']):
            style = 'casual'
    
    avg_price = price_sum / price_count if price_count > 0 else 0
    
    return {
        'style': style,
        'preferences': {
            'favorite_categories': top_categories[:3],
            'favorite_brands': top_brands[:3],
            'average_price': avg_price,
            'price_range': 'budget' if avg_price < 30 else 'mid-range' if avg_price < 80 else 'premium'
        }
    }

def get_complementary_products(product_category: str, user_context: Dict = None) -> List[str]:
    """Get categories that complement the given product category"""
    complementary_map = {
        'Jeans': ['Tops & Tees', 'Sweaters', 'Blazers & Jackets', 'Accessories'],
        'Tops & Tees': ['Jeans', 'Shorts', 'Skirts', 'Blazers & Jackets'],
        'Dresses': ['Accessories', 'Blazers & Jackets', 'Outerwear & Coats'],
        'Suits': ['Tops & Tees', 'Accessories', 'Socks & Hosiery'],
        'Active': ['Accessories', 'Socks & Hosiery'],
        'Swim': ['Accessories', 'Outerwear & Coats', 'Shorts'],
        'Intimates': ['Sleep & Lounge', 'Socks & Hosiery'],
        'Sweaters': ['Jeans', 'Pants', 'Skirts', 'Accessories'],
        'Blazers & Jackets': ['Pants', 'Skirts', 'Tops & Tees'],
        'Shorts': ['Tops & Tees', 'Accessories'],
        'Accessories': ['Dresses', 'Tops & Tees', 'Jeans']
    }
    
    return complementary_map.get(product_category, ['Accessories', 'Tops & Tees'])

def calculate_product_popularity_score(product_data: Dict, order_history: List = None) -> float:
    """Calculate a popularity score for a product"""
    score = 0.0
    
    # Base score from price (inverse relationship - cheaper items might be more popular)
    price = float(product_data.get('retail_price', 50))
    if price < 25:
        score += 0.3
    elif price < 50:
        score += 0.2
    elif price < 100:
        score += 0.1
    
    # Category popularity (some categories are generally more popular)
    popular_categories = ['Tops & Tees', 'Jeans', 'Accessories', 'Dresses']
    if product_data.get('category') in popular_categories:
        score += 0.2
    
    # Brand recognition (top brands get bonus)
    top_brands = ['Calvin Klein', 'Levi\'s', 'Tommy Hilfiger', 'Columbia', 'Champion']
    if product_data.get('brand') in top_brands:
        score += 0.3
    
    # Add randomness to prevent always showing same products
    import random
    score += random.uniform(0, 0.2)
    
    return min(score, 1.0)  # Cap at 1.0

def generate_outfit_suggestions(anchor_product: Dict, all_products: List[Dict]) -> List[Dict]:
    """Generate complete outfit suggestions based on an anchor product"""
    anchor_category = anchor_product.get('category', '')
    anchor_department = anchor_product.get('department', '')
    
    outfit_rules = {
        'Jeans': {
            'tops': ['Tops & Tees', 'Sweaters', 'Blazers & Jackets'],
            'accessories': ['Accessories'],
            'shoes': ['Accessories']  # Assuming shoes are in accessories
        },
        'Dresses': {
            'outerwear': ['Blazers & Jackets', 'Outerwear & Coats'],
            'accessories': ['Accessories'],
            'shoes': ['Accessories']
        },
        'Tops & Tees': {
            'bottoms': ['Jeans', 'Shorts', 'Skirts', 'Pants'],
            'outerwear': ['Blazers & Jackets', 'Sweaters'],
            'accessories': ['Accessories']
        },
        'Active': {
            'accessories': ['Accessories'],
            'outerwear': ['Fashion Hoodies & Sweatshirts']
        }
    }
    
    suggestions = []
    rules = outfit_rules.get(anchor_category, {})
    
    for piece_type, categories in rules.items():
        for category in categories:
            # Find products in this category from the same department
            matching_products = [
                p for p in all_products 
                if p.get('category') == category and p.get('department') == anchor_department
            ]
            
            if matching_products:
                # Pick a random product or the most popular one
                suggested_product = max(matching_products, 
                                      key=lambda x: calculate_product_popularity_score(x))
                suggestions.append({
                    'type': piece_type,
                    'product': suggested_product
                })
    
    return suggestions

def parse_style_keywords(text: str) -> Dict[str, str]:
    """Parse style-related keywords from user input"""
    text_lower = text.lower()
    
    style_keywords = {
        'casual': ['casual', 'relaxed', 'everyday', 'comfortable', 'laid-back'],
        'formal': ['formal', 'business', 'professional', 'work', 'office', 'dressy'],
        'athletic': ['athletic', 'sport', 'gym', 'workout', 'exercise', 'fitness', 'active'],
        'trendy': ['trendy', 'fashionable', 'stylish', 'modern', 'contemporary', 'chic'],
        'classic': ['classic', 'timeless', 'traditional', 'elegant', 'sophisticated'],
        'edgy': ['edgy', 'bold', 'alternative', 'rock', 'punk', 'urban'],
        'bohemian': ['boho', 'bohemian', 'hippie', 'free-spirited', 'artistic'],
        'minimalist': ['minimal', 'simple', 'clean', 'basic', 'understated']
    }
    
    occasion_keywords = {
        'work': ['work', 'office', 'business', 'professional', 'meeting'],
        'party': ['party', 'celebration', 'night out', 'club', 'dancing'],
        'date': ['date', 'romantic', 'dinner', 'evening out'],
        'casual': ['casual', 'everyday', 'weekend', 'relaxed'],
        'vacation': ['vacation', 'travel', 'holiday', 'beach', 'resort'],
        'wedding': ['wedding', 'formal event', 'ceremony'],
        'gym': ['gym', 'workout', 'exercise', 'fitness', 'sport']
    }
    
    result = {}
    
    # Find style
    for style, keywords in style_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            result['style'] = style
            break
    
    # Find occasion
    for occasion, keywords in occasion_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            result['occasion'] = occasion
            break
    
    return result

def get_size_recommendations(user_context: Dict, product_category: str) -> Dict[str, str]:
    """Get size recommendations based on user context and product category"""
    # This is a simplified version - in a real app, you'd have more sophisticated sizing logic
    size_guide = {
        'Women': {
            'Tops & Tees': ['XS', 'S', 'M', 'L', 'XL'],
            'Jeans': ['24', '25', '26', '27', '28', '29', '30', '32'],
            'Dresses': ['0', '2', '4', '6', '8', '10', '12', '14'],
            'Intimates': ['32A', '32B', '34A', '34B', '34C', '36B', '36C']
        },
        'Men': {
            'Tops & Tees': ['S', 'M', 'L', 'XL', 'XXL'],
            'Jeans': ['28', '30', '32', '34', '36', '38', '40'],
            'Suits': ['38R', '40R', '42R', '44R', '46R']
        }
    }
    
    department = user_context.get('gender', 'Women')
    department = 'Women' if department == 'F' else 'Men' if department == 'M' else 'Women'
    
    sizes = size_guide.get(department, {}).get(product_category, ['S', 'M', 'L'])
    
    return {
        'recommended_sizes': sizes,
        'size_guide_url': f'/size-guide/{department.lower()}/{product_category.lower().replace(" ", "-")}',
        'department': department
    }
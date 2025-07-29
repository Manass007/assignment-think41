import requests
import json
import os
from typing import Dict, List, Any
import re

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

# Fashion categories mapping for better understanding
FASHION_CATEGORIES = {
    # Main categories from your database
    'intimates': 'Intimates',
    'lingerie': 'Intimates',
    'underwear': 'Intimates',
    'bras': 'Intimates',
    'panties': 'Intimates',
    'undergarments': 'Intimates',
    
    'jeans': 'Jeans',
    'denim': 'Jeans',
    
    'tops': 'Tops & Tees',
    'tees': 'Tops & Tees',
    'shirts': 'Tops & Tees',
    't-shirts': 'Tops & Tees',
    'blouses': 'Tops & Tees',
    'tank tops': 'Tops & Tees',
    
    'hoodies': 'Fashion Hoodies & Sweatshirts',
    'sweatshirts': 'Fashion Hoodies & Sweatshirts',
    'hoody': 'Fashion Hoodies & Sweatshirts',
    
    'swimwear': 'Swim',
    'swim': 'Swim',
    'bikinis': 'Swim',
    'bathing suits': 'Swim',
    'swimsuits': 'Swim',
    
    'sleepwear': 'Sleep & Lounge',
    'pajamas': 'Sleep & Lounge',
    'pjs': 'Sleep & Lounge',
    'loungewear': 'Sleep & Lounge',
    'nightwear': 'Sleep & Lounge',
    
    'shorts': 'Shorts',
    'sweaters': 'Sweaters',
    'knitwear': 'Sweaters',
    'cardigans': 'Sweaters',
    'pullovers': 'Sweaters',
    
    'accessories': 'Accessories',
    'bags': 'Accessories',
    'jewelry': 'Accessories',
    'belts': 'Accessories',
    'hats': 'Accessories',
    'caps': 'Accessories',
    'purses': 'Accessories',
    'handbags': 'Accessories',
    
    'activewear': 'Active',
    'sportswear': 'Active',
    'athletic': 'Active',
    'workout': 'Active',
    'gym': 'Active',
    'fitness': 'Active',
    'exercise': 'Active',
    
    'outerwear': 'Outerwear & Coats',
    'coats': 'Outerwear & Coats',
    'jackets': 'Outerwear & Coats',
    'blazers': 'Blazers & Jackets',
    
    'pants': 'Pants',
    'trousers': 'Pants',
    'chinos': 'Pants',
    'slacks': 'Pants',
    
    'dresses': 'Dresses',
    'socks': 'Socks',
    'hosiery': 'Socks & Hosiery',
    'tights': 'Socks & Hosiery',
    'stockings': 'Socks & Hosiery',
    
    'maternity': 'Maternity',
    'plus size': 'Plus',
    'plus': 'Plus',
    
    'suits': 'Suits',
    'formal': 'Suits & Sport Coats',
    'business': 'Suits & Sport Coats',
    
    'leggings': 'Leggings',
    'skirts': 'Skirts',
    'rompers': 'Jumpsuits & Rompers',
    'jumpsuits': 'Jumpsuits & Rompers',
    'sets': 'Clothing Sets'
}

# Brand mapping (top brands from your data)
TOP_BRANDS = [
    'Allegra K', 'Calvin Klein', 'Carhartt', 'Hanes', 'Volcom', 'Nautica', 
    'Levi\'s', 'Quiksilver', 'Tommy Hilfiger', 'Columbia', 'Hurley', 'Dockers', 
    'Diesel', 'Speedo', 'American Apparel', 'Wrangler', 'Motherhood Maternity', 
    'Champion', '7 For All Mankind', 'Lucky Brand'
]

def create_enhanced_system_prompt() -> str:
    """Create a comprehensive system prompt for fashion e-commerce"""
    return f"""You are STYLISTA, an expert fashion e-commerce AI assistant for a global marketplace with 29,120+ products.

AVAILABLE CATEGORIES: {', '.join(set(FASHION_CATEGORIES.values()))}

TOP BRANDS: {', '.join(TOP_BRANDS[:10])} and many more

DEPARTMENTS: Women (55%), Men (45%)

PRICE RANGE: $0.02 - $999 (average: $59)

GLOBAL USERS: From US, UK, China, Brazil, South Korea (ages 12-70, avg 41)

CAPABILITIES:
1. Product Search & Discovery
2. Style Recommendations  
3. Inventory Checking
4. Price Comparisons
5. Trend Analysis
6. Geographic Preferences
7. Order History Analysis

RESPONSE FORMATS:

For PRODUCT SEARCH (when user asks for specific items), respond with JSON:
{{"action": "search_products", "category": "Jeans", "brand": "Levi's", "department": "Women", "min_price": 50, "max_price": 100}}

For RECOMMENDATIONS (when user asks for style advice), respond with JSON:
{{"action": "recommend_products", "style": "casual", "occasion": "work", "category": "Tops & Tees"}}

For TRENDS (when user asks what's popular/trending), respond with JSON:
{{"action": "show_trends", "category": "Intimates", "timeframe": "recent"}}

For INVENTORY CHECK (when user asks about stock), respond with JSON:
{{"action": "check_inventory", "product_id": 12345}}

For ORDER HISTORY (when user asks about their orders), respond with JSON:
{{"action": "order_history", "timeframe": "recent"}}

QUERY EXAMPLES AND RESPONSES:
- "Find trending items in intimates" → {{"action": "show_trends", "category": "Intimates"}}
- "What activewear does Columbia have?" → {{"action": "search_products", "brand": "Columbia", "category": "Active"}}
- "Show me summer essentials" → {{"action": "search_products", "category": "Swim"}}
- "What's popular in my area?" → {{"action": "show_trends", "category": "all"}}
- "Based on my style, what should I buy?" → {{"action": "recommend_products", "style": "personal"}}
- "What's trending for my age group?" → {{"action": "show_trends", "category": "all"}}

IMPORTANT:
- ALWAYS respond with JSON for product-related queries
- Map user terms to exact category names (e.g., "shirts" → "Tops & Tees")
- Understand fashion terminology and synonyms
- Consider global preferences and cultural differences
- Always be fashion-forward and style-conscious
- If unsure, default to search_products action"""

def extract_fashion_intent(user_message: str) -> Dict[str, Any]:
    """Extract fashion-specific intent from user message with improved matching"""
    message_lower = user_message.lower()
    intent_data = {}
    
    print(f"Extracting intent from: {message_lower}")
    
    # Extract category with better matching
    for keyword, category in FASHION_CATEGORIES.items():
        if keyword in message_lower:
            intent_data['category'] = category
            print(f"Found category: {keyword} → {category}")
            break
    
    # Special handling for summer/seasonal items
    if any(term in message_lower for term in ['summer', 'beach', 'vacation']):
        if 'category' not in intent_data:
            intent_data['category'] = 'Swim'
    
    # Extract brand with case-insensitive matching
    for brand in TOP_BRANDS:
        if brand.lower() in message_lower:
            intent_data['brand'] = brand
            print(f"Found brand: {brand}")
            break
    
    # Extract department
    if any(word in message_lower for word in ['women', 'womens', 'ladies', 'female']):
        intent_data['department'] = 'Women'
    elif any(word in message_lower for word in ['men', 'mens', 'male', 'guys', 'boys']):
        intent_data['department'] = 'Men'
    
    # Extract price hints with regex
    price_patterns = [
        r'under\s*\$?(\d+)',
        r'below\s*\$?(\d+)',
        r'less than\s*\$?(\d+)',
        r'cheaper than\s*\$?(\d+)'
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, message_lower)
        if match:
            try:
                intent_data['max_price'] = float(match.group(1))
                print(f"Found max price: {intent_data['max_price']}")
            except ValueError:
                pass
    
    # Extract minimum price
    min_price_patterns = [
        r'over\s*\$?(\d+)',
        r'above\s*\$?(\d+)',
        r'more than\s*\$?(\d+)',
        r'at least\s*\$?(\d+)'
    ]
    
    for pattern in min_price_patterns:
        match = re.search(pattern, message_lower)
        if match:
            try:
                intent_data['min_price'] = float(match.group(1))
                print(f"Found min price: {intent_data['min_price']}")
            except ValueError:
                pass
    
    # Add general query if no specific category found
    if 'category' not in intent_data and 'brand' not in intent_data:
        # Extract key fashion terms as general query
        fashion_terms = ['dress', 'shirt', 'pant', 'shoe', 'bag', 'hat', 'coat', 'jacket']
        for term in fashion_terms:
            if term in message_lower:
                intent_data['query'] = term
                break
    
    print(f"Extracted intent: {intent_data}")
    return intent_data

def enhance_messages_with_context(messages: List[Dict], user_context: Dict = None) -> List[Dict]:
    """Add fashion context to conversation"""
    # Add enhanced system prompt
    enhanced_messages = [{"role": "system", "content": create_enhanced_system_prompt()}]
    
    # Add user context if available
    if user_context:
        context_msg = f"USER CONTEXT: Age: {user_context.get('age', 'N/A')}, Gender: {user_context.get('gender', 'N/A')}, Location: {user_context.get('location', 'N/A')}"
        enhanced_messages.append({"role": "system", "content": context_msg})
    
    # Add conversation history (skip original system message)
    for msg in messages[1:]:
        enhanced_messages.append(msg)
    
    return enhanced_messages

def query_llm(messages: List[Dict], user_context: Dict = None, max_retries: int = 2) -> str:
    """Enhanced LLM query with fashion intelligence and retry logic"""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Enhance messages with fashion context
    enhanced_messages = enhance_messages_with_context(messages, user_context)
    
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": enhanced_messages,
        "max_tokens": 1024,  # Increased for detailed responses
        "temperature": 0.3,  # Lower temperature for more consistent JSON responses
        "top_p": 0.9,
        "frequency_penalty": 0.1
    }
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()["choices"][0]["message"]["content"]
            
            # Log successful response for debugging
            print(f"LLM Response (attempt {attempt + 1}): {result[:200]}...")
            
            return result
            
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error on attempt {attempt + 1}: {e}")
            if attempt == max_retries:
                return create_fallback_response(enhanced_messages[-1]["content"] if enhanced_messages else "")
                
        except requests.exceptions.Timeout:
            print(f"Timeout on attempt {attempt + 1}")
            if attempt == max_retries:
                return create_fallback_response(enhanced_messages[-1]["content"] if enhanced_messages else "")
                
        except requests.exceptions.RequestException as e:
            print(f"Request error on attempt {attempt + 1}: {e}")
            if attempt == max_retries:
                return create_fallback_response(enhanced_messages[-1]["content"] if enhanced_messages else "")
                
        except Exception as e:
            print(f"Unexpected error on attempt {attempt + 1}: {e}")
            if attempt == max_retries:
                return create_fallback_response(enhanced_messages[-1]["content"] if enhanced_messages else "")

def create_fallback_response(user_message: str) -> str:
    """Create a fallback JSON response when LLM fails"""
    user_lower = user_message.lower()
    
    # Analyze user message and create appropriate fallback
    if any(term in user_lower for term in ['trending', 'popular', 'hot']):
        if 'intimates' in user_lower:
            return '{"action": "show_trends", "category": "Intimates"}'
        else:
            return '{"action": "show_trends", "category": "all"}'
    
    elif any(brand.lower() in user_lower for brand in TOP_BRANDS):
        for brand in TOP_BRANDS:
            if brand.lower() in user_lower:
                if 'activewear' in user_lower or 'active' in user_lower:
                    return f'{{"action": "search_products", "brand": "{brand}", "category": "Active"}}'
                else:
                    return f'{{"action": "search_products", "brand": "{brand}"}}'
    
    elif any(term in user_lower for term in ['summer', 'beach', 'vacation']):
        return '{"action": "search_products", "category": "Swim"}'
    
    elif any(term in user_lower for term in ['style', 'recommend', 'suggest']):
        return '{"action": "recommend_products", "style": "personal"}'
    
    elif 'age' in user_lower or 'my area' in user_lower:
        return '{"action": "show_trends", "category": "all"}'
    
    else:
        # Default to search with extracted intent
        intent = extract_fashion_intent(user_message)
        if intent:
            return json.dumps({"action": "search_products", **intent})
        else:
            return '{"action": "search_products", "query": "popular items"}'

def parse_llm_response(response: str) -> tuple[bool, Dict]:
    """Parse LLM response and extract JSON commands if present"""
    try:
        # Clean the response
        response_clean = response.strip()
        
        print(f"Parsing response: {response_clean[:100]}...")
        
        # Try to find JSON in the response using various methods
        json_patterns = [
            # Complete JSON object at start
            r'^\{[^}]*\}',
            # JSON object anywhere in text
            r'\{[^}]*"action"[^}]*\}',
            # More flexible JSON matching
            r'\{[^{}]*\}',
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, response_clean, re.DOTALL)
            for match in matches:
                try:
                    parsed = json.loads(match)
                    if 'action' in parsed:
                        print(f"Successfully parsed JSON: {parsed}")
                        return True, parsed
                except json.JSONDecodeError:
                    continue
        
        # If no JSON found but response looks like it should be JSON
        if 'action' in response_clean and ('{' in response_clean or 'search_products' in response_clean):
            print("Response contains action but failed to parse, creating fallback...")
            # Try to extract action and create minimal JSON
            if 'search_products' in response_clean:
                return True, {"action": "search_products"}
            elif 'show_trends' in response_clean:
                return True, {"action": "show_trends"}
            elif 'recommend_products' in response_clean:
                return True, {"action": "recommend_products"}
        
        print("No valid JSON found in response")
        return False, {}
        
    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        return False, {}

# Additional utility functions for better fashion understanding
def normalize_category_name(category_input: str) -> str:
    """Normalize category input to match database categories"""
    category_lower = category_input.lower().strip()
    
    # Direct mapping
    if category_lower in FASHION_CATEGORIES:
        return FASHION_CATEGORIES[category_lower]
    
    # Partial matching
    for keyword, category in FASHION_CATEGORIES.items():
        if keyword in category_lower or category_lower in keyword:
            return category
    
    # Fallback - return original input
    return category_input

def extract_seasonal_preferences(message: str) -> List[str]:
    """Extract seasonal preferences from user message"""
    seasonal_keywords = {
        'summer': ['Swim', 'Shorts', 'Tops & Tees'],
        'winter': ['Sweaters', 'Outerwear & Coats', 'Fashion Hoodies & Sweatshirts'],
        'spring': ['Tops & Tees', 'Light Jackets', 'Dresses'],
        'fall': ['Sweaters', 'Jeans', 'Blazers & Jackets'],
        'beach': ['Swim', 'Shorts', 'Accessories'],
        'work': ['Blazers & Jackets', 'Pants', 'Tops & Tees'],
        'gym': ['Active'],
        'party': ['Dresses', 'Accessories', 'Suits']
    }
    
    message_lower = message.lower()
    for season, categories in seasonal_keywords.items():
        if season in message_lower:
            return categories
    
    return []
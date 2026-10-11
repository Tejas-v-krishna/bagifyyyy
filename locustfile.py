"""
BAGIFYYYY Load Testing Simulation with Locust
=============================================
Simulates realistic visitor and shopper traffic across the storefront:
- Browsing homepage, catalog drops, categories, and bundle pages
- Dynamic product fetching and search queries
- Real-time stock reservation status polling on product detail pages
- High-intent shopping flows (bag hold & checkout navigation)

To run:
    pip install locust
    locust -f locustfile.py --host=http://localhost:3000

Then open http://localhost:8089 in your browser to start the simulation.
"""

import random
from locust import HttpUser, task, between, events

# Fallback IDs in case /api/products is unreachable on first tick
PRODUCT_POOL = []
SEARCH_TERMS = ["jacket", "hoodie", "cargo", "denim", "oversized", "vintage", "tee", "leather"]
CATEGORIES = ["topwears", "bottomwears", "unisex", "accessories"]


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("🚀 Initializing BAGIFYYYY Load Simulation...")


class CasualShopper(HttpUser):
    """
    Represents the majority of visitors (~70%):
    Browses drops, navigates categories, searches, and reads product pages.
    """
    weight = 7
    wait_time = between(1, 3)

    def on_start(self):
        # Fetch available products dynamically to seed the product pool
        global PRODUCT_POOL
        if not PRODUCT_POOL:
            try:
                res = self.client.get("/api/products", name="/api/products")
                if res.status_code == 200:
                    items = res.json()
                    if isinstance(items, list) and len(items) > 0:
                        PRODUCT_POOL = [item["id"] for item in items if "id" in item]
            except Exception:
                pass

    @task(5)
    def view_homepage(self):
        """Browse landing page (Hero, manifesto, ticker, featured rails)"""
        self.client.get("/", name="/")

    @task(4)
    def browse_catalog(self):
        """Browse all drops & trigger background API catalogue load"""
        self.client.get("/products", name="/products")
        self.client.get("/api/products", name="/api/products")

    @task(3)
    def browse_category(self):
        """Filter by specific categories"""
        cat = random.choice(CATEGORIES)
        self.client.get(f"/{cat}", name=f"/<category>")
        self.client.get(f"/api/products?category={cat}", name="/api/products?category=[cat]")

    @task(4)
    def search_pieces(self):
        """Shoppers searching for vintage aesthetics & styles"""
        term = random.choice(SEARCH_TERMS)
        self.client.get(f"/api/search?q={term}", name="/api/search?q=[query]")

    @task(5)
    def view_product_detail(self):
        """Inspect a single piece and poll real-time stock reservation"""
        if PRODUCT_POOL:
            prod_id = random.choice(PRODUCT_POOL)
            self.client.get(f"/product/{prod_id}", name="/product/[id]")
            self.client.get(f"/api/stock-status?productId={prod_id}", name="/api/stock-status?productId=[id]")

    @task(2)
    def browse_bundles(self):
        """Browse curated outfit bundles"""
        self.client.get("/bundles", name="/bundles")
        self.client.get("/api/bundles", name="/api/bundles")


class HighIntentBuyer(HttpUser):
    """
    Represents eager collectors (~30%):
    Quickly navigates to specific products, verifies 1-of-1 live stock,
    and moves towards checkout.
    """
    weight = 3
    wait_time = between(0.5, 2)

    @task(5)
    def product_and_stock_check(self):
        """Direct landing on a Grail drop & polling live reservation status"""
        if PRODUCT_POOL:
            prod_id = random.choice(PRODUCT_POOL)
            self.client.get(f"/product/{prod_id}", name="/product/[id]")
            # Simulates live polling while shopper is considering
            for _ in range(2):
                self.client.get(f"/api/stock-status?productId={prod_id}", name="/api/stock-status?productId=[id]")

    @task(2)
    def simulate_add_to_bag_hold(self):
        """Simulate holding a piece in cart session"""
        if PRODUCT_POOL:
            prod_id = random.choice(PRODUCT_POOL)
            self.client.post(
                "/api/cart-hold",
                json={
                    "items": [
                        {"productId": prod_id, "quantity": 1, "size": "One Size"}
                    ]
                },
                name="/api/cart-hold"
            )

    @task(1)
    def view_checkout(self):
        """Visit checkout page"""
        self.client.get("/checkout", name="/checkout")

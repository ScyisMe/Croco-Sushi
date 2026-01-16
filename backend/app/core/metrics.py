from prometheus_client import Counter, Histogram

# Business Metrics
orders_total = Counter(
    "crocosushi_orders_total",
    "Total number of orders created",
    ["status"]
)

upsell_conversion = Counter(
    "crocosushi_upsell_conversion",
    "Number of successful upsell additions"
)

revenue_total = Counter(
    "crocosushi_revenue_total",
    "Total revenue in UAH",
    ["payment_method", "type"]
)

order_value_dist = Histogram(
    "crocosushi_order_value_dist",
    "Distribution of order values (check size)",
    buckets=[100, 300, 500, 800, 1000, 1500, 2000, 3000, 5000]
)

order_creation_seconds = Histogram(
    "crocosushi_order_creation_seconds",
    "Time taken to process order creation",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

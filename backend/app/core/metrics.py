from prometheus_client import Counter

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

import Script from "next/script";

// Базова інформація про бізнес
export const BUSINESS_INFO = {
  name: "Croco Sushi",
  description: "Croco Sushi - сервіс швидкої кухні. Смачні суші з доставкою додому у Львові.",
  url: "https://crocosushi.com.ua",
  logo: "https://crocosushi.com.ua/logo.jpg",
  telephone: "+380 (98) 097 00 03",
  email: "crocosushi0003@gmail.com",
  mapsUrl: "https://maps.app.goo.gl/JksKK3KqdouctZ6UJ",
  address: {
    streetAddress: "вул. Володимира Янева, 31",
    addressLocality: "Львів",
    addressRegion: "Львівська область",
    postalCode: "79000",
    addressCountry: "UA",
  },
  geo: {
    latitude: 49.8397,
    longitude: 24.0297,
  },
  openingHours: [
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "10:00", closes: "23:00" },
    { dayOfWeek: ["Friday", "Saturday"], opens: "10:00", closes: "00:00" },
    { dayOfWeek: ["Sunday"], opens: "11:00", closes: "23:00" },
  ],
  priceRange: "₴₴",
  servesCuisine: ["Japanese", "Sushi", "Asian"],
  sameAs: [
    "https://www.instagram.com/crocosushi/",
    "https://www.facebook.com/crocosushi/",
    "https://t.me/crocosushi",
  ],
};

// Тип для JSON-LD схеми
type JsonLdSchema = Record<string, unknown>;

interface JsonLdProps {
  schema: JsonLdSchema;
}

// Компонент для вставки JSON-LD
export function JsonLd({ schema }: JsonLdProps) {
  return (
    <Script
      id={`json-ld-${schema["@type"] || "schema"}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Схема організації/ресторану
export function getOrganizationSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${BUSINESS_INFO.url}/#organization`,
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    url: BUSINESS_INFO.url,
    logo: {
      "@type": "ImageObject",
      url: BUSINESS_INFO.logo,
    },
    image: BUSINESS_INFO.logo,
    telephone: BUSINESS_INFO.telephone,
    email: BUSINESS_INFO.email,
    address: {
      "@type": "PostalAddress",
      ...BUSINESS_INFO.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude,
    },
    openingHoursSpecification: BUSINESS_INFO.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    })),
    priceRange: BUSINESS_INFO.priceRange,
    servesCuisine: BUSINESS_INFO.servesCuisine,
    sameAs: BUSINESS_INFO.sameAs,
    hasMenu: `${BUSINESS_INFO.url}/menu`,
    acceptsReservations: false,
    paymentAccepted: ["Cash", "Credit Card"],
    currenciesAccepted: "UAH",
  };
}

// Схема веб-сайту
export function getWebsiteSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BUSINESS_INFO.url}/#website`,
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.url,
    publisher: {
      "@id": `${BUSINESS_INFO.url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BUSINESS_INFO.url}/menu?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Схема хлібних крихт
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function getBreadcrumbSchema(items: BreadcrumbItem[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Схема продукту
interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku?: string;
  url: string;
  category?: string;
  rating?: {
    value: number;
    count: number;
  };
  inStock?: boolean;
}

export function getProductSchema(product: ProductSchemaProps): JsonLdSchema {
  const schema: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    url: product.url,
    sku: product.sku || product.url.split("/").pop(),
    brand: {
      "@type": "Brand",
      name: BUSINESS_INFO.name,
    },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "UAH",
      availability: product.inStock !== false 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@id": `${BUSINESS_INFO.url}/#organization`,
      },
    },
  };

  if (product.category) {
    schema.category = product.category;
  }

  if (product.rating && product.rating.count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

// Схема меню
interface MenuItemSchema {
  name: string;
  description: string;
  price: number;
  image?: string;
}

interface MenuSectionSchema {
  name: string;
  items: MenuItemSchema[];
}

export function getMenuSchema(sections: MenuSectionSchema[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Меню Croco Sushi",
    hasMenuSection: sections.map((section) => ({
      "@type": "MenuSection",
      name: section.name,
      hasMenuItem: section.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "UAH",
        },
        ...(item.image ? { image: item.image } : {}),
      })),
    })),
  };
}

// Схема FAQ
interface FAQItem {
  question: string;
  answer: string;
}

export function getFAQSchema(items: FAQItem[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// Схема локального бізнесу для сторінки доставки
export function getLocalBusinessSchema(): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "@id": `${BUSINESS_INFO.url}/#localbusiness`,
    name: BUSINESS_INFO.name,
    description: BUSINESS_INFO.description,
    url: BUSINESS_INFO.url,
    telephone: BUSINESS_INFO.telephone,
    address: {
      "@type": "PostalAddress",
      ...BUSINESS_INFO.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude,
    },
    openingHoursSpecification: BUSINESS_INFO.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    })),
    priceRange: BUSINESS_INFO.priceRange,
    servesCuisine: BUSINESS_INFO.servesCuisine,
    hasDeliveryMethod: {
      "@type": "DeliveryMethod",
      name: "Доставка кур'єром",
    },
    areaServed: {
      "@type": "City",
      name: "Львів",
    },
  };
}

// Схема відгуку
interface ReviewSchemaProps {
  author: string;
  datePublished: string;
  rating: number;
  reviewBody: string;
  itemReviewed: {
    name: string;
    type: "Product" | "Restaurant";
  };
}

export function getReviewSchema(review: ReviewSchemaProps): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.author,
    },
    datePublished: review.datePublished,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.reviewBody,
    itemReviewed: {
      "@type": review.itemReviewed.type,
      name: review.itemReviewed.name,
    },
  };
}

// Схема списку відгуків
interface AggregateReviewSchemaProps {
  itemName: string;
  itemType: "Product" | "Restaurant";
  ratingValue: number;
  reviewCount: number;
}

export function getAggregateReviewSchema(props: AggregateReviewSchemaProps): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": props.itemType,
    name: props.itemName,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: props.ratingValue,
      reviewCount: props.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

// Схема акції/пропозиції
interface OfferSchemaProps {
  name: string;
  description: string;
  url: string;
  validFrom?: string;
  validThrough?: string;
  discount?: string;
}

export function getOfferSchema(offer: OfferSchemaProps): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: offer.name,
    description: offer.description,
    url: offer.url,
    ...(offer.validFrom ? { validFrom: offer.validFrom } : {}),
    ...(offer.validThrough ? { validThrough: offer.validThrough } : {}),
    ...(offer.discount ? { 
      priceSpecification: {
        "@type": "PriceSpecification",
        discount: offer.discount,
      }
    } : {}),
    seller: {
      "@id": `${BUSINESS_INFO.url}/#organization`,
    },
  };
}


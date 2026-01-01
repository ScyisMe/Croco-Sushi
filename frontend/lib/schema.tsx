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


// Схема веб-сайту


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



// Схема списку відгуків
interface AggregateReviewSchemaProps {
  itemName: string;
  itemType: "Product" | "Restaurant";
  ratingValue: number;
  reviewCount: number;
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




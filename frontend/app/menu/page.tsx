
import { Metadata } from 'next';
import MenuClient from './MenuClient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = searchParams.category;

  // Capitalize category for title
  const categoryName = typeof category === 'string'
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Menu';

  const title = category
    ? `${categoryName} | Croco Sushi`
    : 'Menu | Croco Sushi';

  const description = category
    ? `Order delicious ${categoryName} from Croco Sushi. Fresh ingredients, fast delivery in Lviv.`
    : 'Explore our full menu at Croco Sushi. Sushi, rolls, sets, and more available for delivery in Lviv.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: category ? `https://crocosushi.com/menu?category=${category}` : 'https://crocosushi.com/menu',
    },
    alternates: {
      canonical: category ? `https://crocosushi.com/menu?category=${category}` : `https://crocosushi.com/menu`,
    }
  };
}

export default function MenuPage() {
  return <MenuClient />;
}

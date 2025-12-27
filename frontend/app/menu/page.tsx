
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

  let title = "Меню Croco Sushi | Доставка суші та ролів у Львові";
  let description = "Замовляйте найсмачніші суші та роли у Львові. Безкоштовна доставка від 1000 грн. Великий вибір сетів, суші та ролів.";

  if (category === 'sushi') {
    title = "Суші у Львові: Доставка додому | Croco Sushi";
    description = "Свіжі нігірі та гункани з лососем, тунцем, вугрем. Замовляйте суші з доставкою по Львову. Тільки свіжа риба!";
  } else if (category === 'rolls') {
    title = "Роли Філадельфія та Дракон | Доставка Львів";
    description = "Авторські роли, Філадельфія, Каліфорнія, Дракони. Найбільшe начинки та найкращий рис. Швидка доставка ролів у Львові.";
  } else if (category === 'sets') {
    title = "Сети суші та ролів у Львові | Croco Sushi";
    description = "Великі сети суші для компаній. Замовляйте набори ролів зі знижкою. Ідеально для вечірок та святкувань.";
  } else if (category) {
    title = `${categoryName} | Доставка їжі Львів | Croco Sushi`;
    description = `Замовляйте ${categoryName} з доставкою по Львову. Свіжі інгредієнти та швидка доставка від Croco Sushi.`;
  }

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

// Helper to get category name
async function getCategoryName(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.crocosushi.com';
    const res = await fetch(`${apiUrl}/api/v1/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const categories: any[] = await res.json();
    const category = categories.find((c: any) => c.slug === slug);
    return category ? category.name : null;
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return null;
  }
}

export default async function MenuPage({ searchParams }: Props) {
  const categorySlug = searchParams.category;
  let initialCategoryName: string | undefined = undefined;

  if (typeof categorySlug === 'string') {
    initialCategoryName = await getCategoryName(categorySlug);

    // Fallback map if fetch fails
    if (!initialCategoryName) {
      const map: Record<string, string> = {
        'sushi': 'Суші',
        'rolls': 'Роли',
        'sets': 'Сети',
        'drinks': 'Напої',
        'sauces': 'Соуси'
      };
      initialCategoryName = map[categorySlug];
    }
  }

  return <MenuClient initialCategoryName={initialCategoryName} />;
}

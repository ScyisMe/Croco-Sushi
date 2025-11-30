import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/lib/types'

// Mock stores
jest.mock('@/store/cartStore', () => ({
    useCartStore: jest.fn((selector) => {
        if (selector.toString().includes('addItem')) return jest.fn()
        if (selector.toString().includes('items.length')) return 0
        return jest.fn()
    }),
    MAX_CART_ITEMS: 99,
}))

jest.mock('@/store/localeStore', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}))

const mockProduct: Product = {
    id: 1,
    name: 'Test Sushi',
    slug: 'test-sushi',
    description: 'Delicious test sushi',
    price: "100",
    image_url: '/test.jpg',
    category_id: 1,
    is_available: true,
    is_new: false,
    is_popular: false,
    is_promotion: false,
    position: 0,
    created_at: '2024-01-01T00:00:00Z',
}

describe('ProductCard', () => {
    it('renders product information', () => {
        render(<ProductCard product={mockProduct} />)

        expect(screen.getByText('Test Sushi')).toBeInTheDocument()
        expect(screen.getByText('Delicious test sushi')).toBeInTheDocument()
        expect(screen.getByText('100 ₴')).toBeInTheDocument()
    })

    it('calls onFavoriteToggle when heart icon is clicked', () => {
        const onFavoriteToggle = jest.fn()
        render(<ProductCard product={mockProduct} onFavoriteToggle={onFavoriteToggle} />)

        const heartButton = screen.getByLabelText('Додати в обране')
        fireEvent.click(heartButton)

        expect(onFavoriteToggle).toHaveBeenCalledWith(1)
    })
})

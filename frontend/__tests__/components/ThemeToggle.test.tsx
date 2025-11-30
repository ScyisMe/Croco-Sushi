import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'

// Mock the store
jest.mock('@/store/themeStore', () => ({
    useThemeStore: jest.fn(() => ({
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: jest.fn(),
        initTheme: jest.fn(),
    })),
}))

describe('ThemeToggle', () => {
    it('renders theme options', () => {
        render(<ThemeToggle />)

        expect(screen.getByLabelText('Світла')).toBeInTheDocument()
        expect(screen.getByLabelText('Темна')).toBeInTheDocument()
        expect(screen.getByLabelText('Системна')).toBeInTheDocument()
    })
})

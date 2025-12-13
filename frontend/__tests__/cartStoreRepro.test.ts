import { act } from '@testing-library/react';
import { useCartStore } from '../store/cartStore';

describe('Cart Store Logic', () => {
    beforeEach(() => {
        useCartStore.getState().clearCart();
    });

    it('should add and remove items correctly', () => {
        const { addItem, removeItem } = useCartStore.getState();

        // Add Item 1
        act(() => {
            addItem({
                id: 1,
                name: 'Sushi 1',
                price: 100,
                quantity: 1,
            });
        });

        expect(useCartStore.getState().items.length).toBe(1);

        // Add Item 2
        act(() => {
            addItem({
                id: 2,
                name: 'Sushi 2',
                price: 200,
                quantity: 1,
            });
        });

        expect(useCartStore.getState().items.length).toBe(2);

        // Remove Item 1
        act(() => {
            removeItem(1);
        });

        expect(useCartStore.getState().items.length).toBe(1);
        expect(useCartStore.getState().items[0].id).toBe(2);

        // Remove Item 2 (Last Item)
        act(() => {
            removeItem(2);
        });

        expect(useCartStore.getState().items.length).toBe(0);
    });

    it('should handle sizeId correctly', () => {
        const { addItem, removeItem } = useCartStore.getState();

        // Add Item with Size
        act(() => {
            addItem({
                id: 3,
                name: 'Sushi Size',
                price: 150,
                quantity: 1,
                sizeId: 10,
                size: 'Large',
            });
        });

        // Add Same Item with Different Size
        act(() => {
            addItem({
                id: 3,
                name: 'Sushi Size',
                price: 100,
                quantity: 1,
                sizeId: 20,
                size: 'Small',
            });
        });

        expect(useCartStore.getState().items.length).toBe(2);

        // Remove First Size
        act(() => {
            removeItem(3, 10);
        });

        expect(useCartStore.getState().items.length).toBe(1);
        expect(useCartStore.getState().items[0].sizeId).toBe(20);

        // Remove Last Size
        act(() => {
            removeItem(3, 20);
        });

        expect(useCartStore.getState().items.length).toBe(0);
    });

    it('should handle missing sizeId vs passed undefined', () => {
        const { addItem, removeItem } = useCartStore.getState();

        act(() => {
            addItem({
                id: 5,
                name: 'No Size',
                price: 50,
                quantity: 1
            });
        });

        expect(useCartStore.getState().items.length).toBe(1);

        // Remove with default undefined
        act(() => {
            removeItem(5);
        });

        expect(useCartStore.getState().items.length).toBe(0);
    });
});

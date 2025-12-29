import { useState, useEffect } from "react";

export const useWorkingHours = () => {
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const checkWorkingHours = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            // Відкрито з 10:00 до 21:45
            if (hours < 10) return false;
            if (hours > 21) return false;
            if (hours === 21 && minutes > 45) return false;
            return true;
        };

        setIsOpen(checkWorkingHours());

        // Оновлюємо статус кожну хвилину
        const interval = setInterval(() => {
            setIsOpen(checkWorkingHours());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return { isOpen, isMounted };
};

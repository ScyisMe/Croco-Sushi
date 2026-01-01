"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endDate: string;
  className?: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ endDate, className = "", onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        onExpire?.();
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Початковий розрахунок
    setTimeLeft(calculateTimeLeft());

    // Оновлення кожну секунду
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  if (isExpired) {
    return (
      <div className={`text-accent-red font-medium ${className}`}>
        Акція завершена
      </div>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className={`flex items-start gap-2 md:gap-3 ${className}`}>
      {/* Дні */}
      {timeLeft.days > 0 && (
        <>
          <div className="flex flex-col items-center">
            <div className="bg-secondary text-white font-bold text-2xl md:text-3xl px-3 py-2 rounded-xl min-w-[50px] md:min-w-[60px] text-center shadow-lg">
              {formatNumber(timeLeft.days)}
            </div>
            <span className="text-xs md:text-sm text-secondary-light mt-1 font-medium uppercase tracking-wider">дн</span>
          </div>
          <span className="text-secondary font-bold text-2xl mt-2 opacity-50">:</span>
        </>
      )}

      {/* Години */}
      <div className="flex flex-col items-center">
        <div className="bg-secondary text-white font-bold text-2xl md:text-3xl px-3 py-2 rounded-xl min-w-[50px] md:min-w-[60px] text-center shadow-lg">
          {formatNumber(timeLeft.hours)}
        </div>
        <span className="text-xs md:text-sm text-secondary-light mt-1 font-medium uppercase tracking-wider">год</span>
      </div>
      <span className="text-secondary font-bold text-2xl mt-2 opacity-50">:</span>

      {/* Хвилини */}
      <div className="flex flex-col items-center">
        <div className="bg-secondary text-white font-bold text-2xl md:text-3xl px-3 py-2 rounded-xl min-w-[50px] md:min-w-[60px] text-center shadow-lg">
          {formatNumber(timeLeft.minutes)}
        </div>
        <span className="text-xs md:text-sm text-secondary-light mt-1 font-medium uppercase tracking-wider">хв</span>
      </div>
      <span className="text-secondary font-bold text-2xl mt-2 opacity-50">:</span>

      {/* Секунди */}
      <div className="flex flex-col items-center">
        <div className="bg-primary text-white font-bold text-2xl md:text-3xl px-3 py-2 rounded-xl min-w-[50px] md:min-w-[60px] text-center shadow-lg shadow-primary/20 animate-pulse">
          {formatNumber(timeLeft.seconds)}
        </div>
        <span className="text-xs md:text-sm text-secondary-light mt-1 font-medium uppercase tracking-wider">сек</span>
      </div>
    </div>
  );
}

// Компактна версія для карток
export function CountdownTimerCompact({ endDate, className = "" }: Omit<CountdownTimerProps, "onExpire">) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (isExpired) {
    return (
      <span className={`text-accent-red text-sm ${className}`}>
        Завершено
      </span>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  // Якщо залишилось менше 24 годин - показуємо години:хвилини:секунди
  if (timeLeft.days === 0) {
    return (
      <span className={`font-mono font-bold text-accent-red ${className}`}>
        {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
      </span>
    );
  }

  // Якщо більше - показуємо дні та години
  return (
    <span className={`font-mono font-bold text-secondary ${className}`}>
      {timeLeft.days}д {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}
    </span>
  );
}




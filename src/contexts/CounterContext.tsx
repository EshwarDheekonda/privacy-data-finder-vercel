import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CounterContextType {
  count: number;
  incrementCounter: () => void;
}

const CounterContext = createContext<CounterContextType | undefined>(undefined);

const STORAGE_KEY = 'assessment_counter';
const INITIAL_COUNT = 127438; // Base count to start from

interface CounterProviderProps {
  children: ReactNode;
}

export const CounterProvider: React.FC<CounterProviderProps> = ({ children }) => {
  const [count, setCount] = useState<number>(INITIAL_COUNT);

  // Load counter from localStorage on mount
  useEffect(() => {
    const savedCount = localStorage.getItem(STORAGE_KEY);
    if (savedCount) {
      const parsedCount = parseInt(savedCount, 10);
      if (parsedCount > INITIAL_COUNT) {
        setCount(parsedCount);
      }
    }
  }, []);

  // Save counter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, count.toString());
  }, [count]);

  const incrementCounter = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <CounterContext.Provider value={{ count, incrementCounter }}>
      {children}
    </CounterContext.Provider>
  );
};

export const useCounter = (): CounterContextType => {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
};
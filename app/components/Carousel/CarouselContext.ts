import React from 'react';

export interface CarouselContextProps {
    items: number[];
    activeItem: number | undefined;
    setActiveItem: React.Dispatch<React.SetStateAction<number | undefined>>;
    registerItem: (order: number) => void;
    unregisterItem: (order: number) => void;
}

const CarouselContext = React.createContext<CarouselContextProps>({
    items: [],
    activeItem: undefined,
    setActiveItem: () => {
        // eslint-disable-next-line no-console
        console.warn('CarouselContext::setActiveItem called before it was initialized');
    },
    registerItem: () => {
        // eslint-disable-next-line no-console
        console.warn('CarouselContext::registerItem called before it was initialized');
    },
    unregisterItem: () => {
        // eslint-disable-next-line no-console
        console.warn('CarouselContext::unregisterItem called before it was initialized');
    },
});

export default CarouselContext;

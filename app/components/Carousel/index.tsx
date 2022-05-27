import React from 'react';
import {
    _cs,
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';

import CarouselContext from './CarouselContext';

import styles from './styles.css';

function bound(value: number, min: number, max: number) {
    const bounded = Math.max(Math.min(value, max), min);
    return bounded;
}

interface Props {
    className?: string;
    children: React.ReactNode;
}

function Carousel(props: Props) {
    const {
        className,
        children,
    } = props;

    interface ItemState {
        items: number[];
        activeItem: number | undefined;
    }

    const [
        itemState,
        setItemState,
    ] = React.useState<ItemState>({
        items: [],
        activeItem: 1,
    });

    type setterFn = React.Dispatch<React.SetStateAction<number | undefined>>;
    const setActiveItemSafe: setterFn = React.useCallback((newValueOrSetter) => {
        if (typeof newValueOrSetter === 'function') {
            setItemState((prevState) => {
                const newValue = newValueOrSetter(prevState.activeItem);

                if (isNotDefined(newValue)) {
                    return {
                        ...prevState,
                        activeItem: newValue,
                    };
                }

                const boundedValue = bound(
                    newValue ?? 1,
                    1,
                    prevState.items.length,
                );

                return {
                    ...prevState,
                    activeItem: boundedValue,
                };
            });
        } else if (typeof newValueOrSetter === 'number') {
            setItemState((prevState) => {
                const boundedValue = bound(
                    newValueOrSetter,
                    1,
                    prevState.items.length,
                );
                return {
                    ...prevState,
                    activeItem: boundedValue,
                };
            });
        }
        // setActiveItem(newValueOrSetter);
    }, []);

    const registerItem = React.useCallback((order) => {
        setItemState((prevState) => {
            if (prevState.items.findIndex((i) => i === order) !== -1) {
                // eslint-disable-next-line no-console
                console.error('Item with given order already exists in the carousel');
                return prevState;
            }

            const newItemList = [...prevState.items, order];
            return {
                ...prevState,
                items: newItemList,
            };
        });
    }, []);

    const unregisterItem = React.useCallback((order) => {
        setItemState((prevState) => {
            const index = prevState.items.findIndex((i) => i === order);
            if (index === -1) {
                // eslint-disable-next-line no-console
                console.error('Item with given order does not exist on carousel');
                return prevState;
            }

            const newItems = [...prevState.items];
            newItems.splice(index, 1);

            const newActiveItem = (
                isDefined(prevState.activeItem) && prevState.activeItem
            ) > newItems.length
                ? newItems.length
                : prevState.activeItem;

            return {
                activeItem: newActiveItem,
                items: newItems,
            };
        });
    }, []);

    const contextValue = React.useMemo(() => ({
        items: itemState.items,
        activeItem: itemState.activeItem,
        setActiveItem: setActiveItemSafe,
        registerItem,
        unregisterItem,
    }), [
        itemState,
        setActiveItemSafe,
        registerItem,
        unregisterItem,
    ]);

    return (
        <div className={_cs(styles.carousel, className)}>
            <CarouselContext.Provider value={contextValue}>
                {children}
            </CarouselContext.Provider>
        </div>
    );
}

export default Carousel;

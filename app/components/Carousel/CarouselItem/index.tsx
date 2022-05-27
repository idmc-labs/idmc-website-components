import React from 'react';
import { _cs } from '@togglecorp/fujs';

import CarouselContext from '../CarouselContext';

import styles from './styles.css';

interface Props {
    order: number;
    className?: string;
    children: React.ReactNode;
}

function CarouselItem(props: Props) {
    const {
        order,
        className,
        children,
    } = props;

    const {
        activeItem,
        registerItem,
        unregisterItem,
    } = React.useContext(CarouselContext);

    React.useEffect(() => {
        registerItem(order);

        return () => { unregisterItem(order); };
    }, [registerItem, unregisterItem, order]);

    if (activeItem !== order) {
        return null;
    }

    return (
        <div className={_cs(styles.carouselItem, className)}>
            {children}
        </div>
    );
}

export default CarouselItem;

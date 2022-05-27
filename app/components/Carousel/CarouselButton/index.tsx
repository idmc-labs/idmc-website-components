import React from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';

import RawButton from '#components/RawButton';
import CarouselContext from '../CarouselContext';

import styles from './styles.css';

type BaseProps = {
    className?: string;
    children?: React.ReactNode;
}

type Props = BaseProps & ({
    action: 'set';
    order: number;
} | {
    action: 'prev' | 'next';
    order?: never;
})

function CarouselButton(props: Props) {
    const {
        className,
        children,
    } = props;

    const {
        setActiveItem,
    } = React.useContext(CarouselContext);

    const handleClick = React.useCallback(() => {
        if (props.action === 'set') {
            setActiveItem(props.order);
        }

        if (props.action === 'prev') {
            setActiveItem(
                (prevItem) => (isDefined(prevItem) ? (prevItem - 1) : undefined),
            );
        }

        if (props.action === 'next') {
            setActiveItem(
                (prevItem) => (isDefined(prevItem) ? (prevItem + 1) : undefined),
            );
        }
    }, [props.action, props.order]);

    return (
        <RawButton
            className={_cs(styles.carouselButton, className)}
            name={undefined}
            onClick={handleClick}
        >
            {children}
        </RawButton>
    );
}

export default CarouselButton;

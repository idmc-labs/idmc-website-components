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

    const { setActiveItem } = React.useContext(CarouselContext);

    const handleClick = React.useCallback(() => {
        // eslint-disable-next-line react/destructuring-assignment
        if (props.action === 'set') {
            // eslint-disable-next-line react/destructuring-assignment
            setActiveItem(props.order);
        }

        // eslint-disable-next-line react/destructuring-assignment
        if (props.action === 'prev') {
            setActiveItem(
                (prevItem) => (isDefined(prevItem) ? (prevItem - 1) : undefined),
            );
        }

        // eslint-disable-next-line react/destructuring-assignment
        if (props.action === 'next') {
            setActiveItem(
                (prevItem) => (isDefined(prevItem) ? (prevItem + 1) : undefined),
            );
        }

        // eslint-disable-next-line react/destructuring-assignment
    }, [props.action, props.order, setActiveItem]);

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

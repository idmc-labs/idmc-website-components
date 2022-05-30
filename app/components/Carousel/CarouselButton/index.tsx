import React from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    IoRadioButtonOffOutline,
    IoRadioButtonOnOutline,
    IoChevronForward,
    IoChevronBack,
} from 'react-icons/io5';

import RawButton from '#components/RawButton';
import CarouselContext from '../CarouselContext';

import styles from './styles.css';

type BaseProps = {
    className?: string;
    activeClassName?: string;
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
        activeClassName,
    } = props;

    const {
        setActiveItem,
        activeItem,
    } = React.useContext(CarouselContext);

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

    // eslint-disable-next-line react/destructuring-assignment
    const isActive = props.action === 'set' && activeItem === props.order;
    return (
        <RawButton
            className={_cs(
                styles.carouselButton,
                className,
            )}
            name={undefined}
            onClick={handleClick}
        >
            {/* eslint-disable-next-line react/destructuring-assignment */}
            {props.action === 'next' && <IoChevronForward />}
            {/* eslint-disable-next-line react/destructuring-assignment */}
            {props.action === 'prev' && <IoChevronBack />}
            {/* eslint-disable-next-line react/destructuring-assignment */}
            {props.action === 'set' && !isActive && <IoRadioButtonOffOutline />}
            {/* eslint-disable-next-line react/destructuring-assignment */}
            {props.action === 'set' && isActive && <IoRadioButtonOnOutline />}
        </RawButton>
    );
}

export default CarouselButton;

import React from 'react';
import { IoExpand } from 'react-icons/io5';
import {
    Modal,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';
import useBooleanState from '#hooks/useBooleanState';

import CarouselContext from '../CarouselContext';

import styles from './styles.css';

interface Props {
    order: number;
    className?: string;
    children: React.ReactNode;
    expandedClassName?: string;
}

function CarouselItem(props: Props) {
    const {
        order,
        className,
        children,
        expandedClassName,
    } = props;

    const {
        activeItem,
        registerItem,
        unregisterItem,
        setShouldAnimate,
    } = React.useContext(CarouselContext);

    const [
        isExpanded,
        setIsExpandedTrue,
        setIsExpandedFalse,
    ] = useBooleanState(false);

    React.useEffect(() => {
        setShouldAnimate(!isExpanded);
    }, [isExpanded, setShouldAnimate]);

    React.useEffect(() => {
        registerItem(order);

        return () => { unregisterItem(order); };
    }, [registerItem, unregisterItem, order]);

    if (activeItem !== order) {
        return null;
    }

    return (
        <>
            <div className={_cs(styles.carouselItem, className)}>
                <Button
                    name={undefined}
                    className={styles.expandButton}
                    variant="action"
                    darkMode
                    onClick={setIsExpandedTrue}
                >
                    <IoExpand />
                </Button>
                {children}
            </div>
            {isExpanded && (
                <Modal
                    backdropClassName={styles.modalBackdrop}
                    className={styles.expandedModal}
                    bodyClassName={expandedClassName}
                    onCloseButtonClick={setIsExpandedFalse}
                >
                    {children}
                </Modal>
            )}
        </>
    );
}

export default CarouselItem;

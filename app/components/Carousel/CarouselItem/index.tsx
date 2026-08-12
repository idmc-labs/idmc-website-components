import React from 'react';
import { IoExpand } from 'react-icons/io5';
import { Button, Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import useBooleanState from '#hooks/useBooleanState';

import CarouselContext from '../CarouselContext';

import styles from './styles.css';

interface Props {
    order: number;
    className?: string;
    children: React.ReactNode;
    expandedClassName?: string;
    // Show the "expand to a larger popup" button (default: true).
    expandable?: boolean;
}

function CarouselItem(props: Props) {
    const {
        order,
        className,
        children,
        expandedClassName,
        expandable = true,
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
                {expandable && (
                    <Button
                        name={undefined}
                        className={styles.expandButton}
                        onClick={setIsExpandedTrue}
                        transparent
                    >
                        <IoExpand />
                    </Button>
                )}
                {children}
            </div>
            {expandable && isExpanded && (
                <Modal
                    backdropClassName={styles.modalBackdrop}
                    className={styles.expandedModal}
                    bodyClassName={expandedClassName}
                    onClose={setIsExpandedFalse}
                    size="cover"
                >
                    {children}
                </Modal>
            )}
        </>
    );
}

export default CarouselItem;

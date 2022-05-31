import React from 'react';
import { IoExpand } from 'react-icons/io5';
import {
    Modal,
    useBooleanState,
} from '@the-deep/deep-ui';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/Button';

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
    } = React.useContext(CarouselContext);

    const [
        isExpanded,
        setIsExpandedTrue,
        setIsExpandedFalse,
    ] = useBooleanState(false);

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
import React from 'react';
import {
    IoChevronForward,
    IoChevronDown,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props<N> {
    className?: string;
    header?: React.ReactNode;
    children?: React.ReactNode;
    isExpanded?: boolean;
    name: N,
    onExpansionChange: (isExpanded: boolean, name: N) => void;
}

function CollapsibleContent<N>(props: Props<N>) {
    const {
        className,
        header,
        children,
        isExpanded,
        name,
        onExpansionChange,
    } = props;

    const handleHeaderClick = React.useCallback(() => {
        if (onExpansionChange) {
            onExpansionChange(!isExpanded, name);
        }
    }, [onExpansionChange, name, isExpanded]);

    return (
        <div className={_cs(styles.collapsibleContent, className)}>
            <div // eslint-disable-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, max-len
                className={styles.headerContainer}
                onClick={handleHeaderClick}
            >
                <div className={styles.header}>
                    {header}
                </div>
                {isExpanded ? (
                    <IoChevronDown className={styles.icon} />
                ) : (
                    <IoChevronForward className={styles.icon} />
                )}
            </div>
            {isExpanded && (
                <div className={styles.children}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsibleContent;

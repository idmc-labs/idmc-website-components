import React, { useState } from 'react';
import {
    IoChevronForward,
    IoChevronDown,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

type Props<N> = {
    className?: string;
    headerContainerClassName?: string;
    childrenClassName?: string;
    headerClassName?: string;
    header?: React.ReactNode;
    children?: React.ReactNode;
    isExpanded?: boolean;
    name: N;
} & ({
    onExpansionChange: (isExpanded: boolean, name: N) => void;
    uncontrolled?: false;
} | {
    onExpansionChange?: (isExpanded: boolean, name: N) => void;
    uncontrolled: true;
});

function CollapsibleContent<N>(props: Props<N>) {
    const {
        className,
        header,
        children,
        headerContainerClassName,
        childrenClassName,
        headerClassName,
        isExpanded: isExpandedFromProps,
        name,
        onExpansionChange,
        uncontrolled,
    } = props;

    const [
        isExpanded,
        setExpansion,
    ] = useState(isExpandedFromProps);

    const handleHeaderClick = React.useCallback(() => {
        if (onExpansionChange) {
            onExpansionChange(!isExpanded, name);
        }
        if (uncontrolled) {
            setExpansion(!isExpanded);
        }
    }, [
        uncontrolled,
        onExpansionChange,
        name,
        isExpanded,
    ]);

    return (
        <div className={_cs(styles.collapsibleContent, className)}>
            <div // eslint-disable-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, max-len
                className={_cs(styles.headerContainer, headerContainerClassName)}
                onClick={handleHeaderClick}
            >
                <div className={_cs(styles.header, headerClassName)}>
                    {header}
                </div>
                {(uncontrolled ? isExpanded : isExpandedFromProps) ? (
                    <IoChevronDown className={styles.icon} />
                ) : (
                    <IoChevronForward className={styles.icon} />
                )}
            </div>
            {(uncontrolled ? isExpanded : isExpandedFromProps) && (
                <div className={_cs(styles.children, childrenClassName)}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsibleContent;

import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export type HeadingSizeType = 'extraSmall' | 'small' | 'medium' | 'large' | 'extraLarge' | 'smallAlt';

interface Props {
    className?: string;
    children?: React.ReactNode;
    size?: HeadingSizeType;
    hideBorder?: boolean;
    darkMode?: boolean;
}

function Heading(props: Props) {
    const {
        className: classNameFromProps,
        children: childrenFromProps,
        size = 'medium',
        hideBorder = false,
        darkMode,
    } = props;

    const children: React.ReactNode = React.useMemo(() => {
        if (size === 'extraLarge' || size === 'large') {
            return (
                <>
                    {childrenFromProps}
                    {!hideBorder && (
                        <div className={styles.border} />
                    )}
                </>
            );
        }

        return childrenFromProps;
    }, [
        size,
        childrenFromProps,
        hideBorder,
    ]);

    const className = _cs(
        styles.heading,
        darkMode && styles.darkMode,
        classNameFromProps,
    );

    return (
        <>
            {size === 'extraSmall' && (
                <h5 className={_cs(styles.extraSmall, className)}>
                    { children }
                </h5>
            )}
            {size === 'small' && (
                <h4 className={_cs(styles.small, className)}>
                    { children }
                </h4>
            )}
            {size === 'smallAlt' && (
                <h4 className={_cs(styles.smallAlt, className)}>
                    { children }
                </h4>
            )}
            {size === 'medium' && (
                <h3 className={_cs(styles.medium, className)}>
                    { children }
                </h3>
            )}
            {size === 'large' && (
                <h2 className={_cs(styles.large, className)}>
                    { children }
                </h2>
            )}
            {size === 'extraLarge' && (
                <h1 className={_cs(styles.extraLarge, className)}>
                    { children }
                </h1>
            )}
        </>
    );
}

export default Heading;

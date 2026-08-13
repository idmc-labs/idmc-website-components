import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface Props {
    className?: string;
    value: string | undefined | null;
    category: string | undefined | null;
}

// Table cell for hazard type: the hazard name as the heading and its category
// as the sub-title.
function HazardType(props: Props) {
    const {
        className,
        value,
        category,
    } = props;

    return (
        <div className={_cs(styles.hazardType, className)}>
            <div className={styles.name}>
                {value || '-'}
            </div>
            <div className={styles.category}>
                {category || '-'}
            </div>
        </div>
    );
}

export default HazardType;

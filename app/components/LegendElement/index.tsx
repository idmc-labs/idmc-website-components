import React from 'react';

import styles from './styles.css';

interface LegendElementProps {
    color: string;
    size?: number;
    label: React.ReactNode;
}

function LegendElement(props: LegendElementProps) {
    const {
        color,
        size = 16,
        label,
    } = props;

    return (
        <div className={styles.legendElement}>
            <div className={styles.circleContainer}>
                <div
                    className={styles.circle}
                    style={{
                        backgroundColor: color,
                        width: `${size}px`,
                        height: `${size}px`,
                    }}
                />
            </div>
            <div className={styles.label}>
                {label}
            </div>
        </div>
    );
}

export default LegendElement;

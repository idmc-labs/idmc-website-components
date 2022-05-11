import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Button from '#components/RawButton';

import styles from './styles.css';

interface BaseLegendElementProps {
    color: string;
    size?: number;
    label: React.ReactNode;
}

type Props<N> = BaseLegendElementProps & ({
    name: N;
    onClick: (name: N) => void;
    isActive: boolean;
} | {
    name?: never;
    onClick?: never;
    isActive?: never;
})

function LegendElement<N>(props: Props<N>) {
    const {
        color,
        size = 16,
        label,
    } = props;

    const children = React.useMemo(() => (
        <>
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
        </>
    ), [label, color, size]);

    if (props.name) {
        return (
            <Button
                className={_cs(
                    styles.legendElement,
                    styles.clickable,
                    props.isActive && styles.isActive,
                )}
                name={props.name}
                onClick={props.onClick}
            >
                {children}
            </Button>
        );
    }

    return (
        <div className={styles.legendElement}>
            {children}
        </div>
    );
}

export default LegendElement;

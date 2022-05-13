import React from 'react';
import { _cs } from '@togglecorp/fujs';

import RawButton, { Props as RawButtonProps } from '#components/RawButton';

import styles from './styles.css';

export function useButtonFeatures(props: {
    variant: 'primary' | 'secondary',
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}) {
    const {
        variant,
        icons,
        actions,
        children,
    } = props;

    const buttonClassName = _cs(
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
    );

    const childrenForOutput = (
        <>
            {icons && (
                <div className={styles.icons}>
                    {icons}
                </div>
            )}
            <div className={styles.children}>
                {children}
            </div>
            {actions && (
                <div className={styles.actions}>
                    {actions}
                </div>
            )}
        </>
    );

    return {
        buttonClassName,
        children: childrenForOutput,
    };
}

interface Props<N> extends RawButtonProps<N> {
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
}

function Button<N>(props: Props<N>) {
    const {
        className,
        icons,
        actions,
        children,
        variant = 'primary',
        ...otherProps
    } = props;

    const {
        buttonClassName,
        children: childrenFromButtonFeatures,
    } = useButtonFeatures({
        variant,
        icons,
        actions,
        children,
    });

    return (
        <RawButton
            className={_cs(className, buttonClassName)}
            {...otherProps}
        >
            {childrenFromButtonFeatures}
        </RawButton>
    );
}

export default Button;

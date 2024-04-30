import React, { useMemo } from 'react';
import { useButtonFeatures } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import RawButton, { Props as RawButtonProps } from '#components/RawButton';

import styles from './styles.css';

type ButtonVariantType = 'primary' | 'secondary' | 'action';

export interface Props<N> extends RawButtonProps<N> {
    className?: string;
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    variant?: ButtonVariantType;
    disabled?: boolean;
    darkMode?: boolean;
    children?: React.ReactNode;
    transparent?: boolean;
}

function Button<N>(props: Props<N>) {
    const {
        icons,
        actions,
        children,
        variant = 'primary',
        darkMode,
        transparent,
        ...otherProps
    } = props;

    const buttonClassName = _cs(
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'action' && styles.action,
        darkMode && styles.darkMode,
        transparent && styles.transparent,
    );

    const {
        className,
    } = useButtonFeatures(otherProps);

    const childrenForOutput = useMemo(() => (
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
    ), [
        icons,
        children,
        actions,
    ]);

    return (
        <RawButton
            className={_cs(className, buttonClassName)}
            {...otherProps}
        >
            {childrenForOutput}
        </RawButton>
    );
}

export default Button;

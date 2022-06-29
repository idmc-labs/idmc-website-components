import React from 'react';
import { _cs } from '@togglecorp/fujs';

import RawButton, { Props as RawButtonProps } from '#components/RawButton';

import styles from './styles.css';

type ButtonVariantType = 'primary' | 'secondary' | 'action' | 'transparent';

export function useButtonFeatures(props: {
    variant: ButtonVariantType,
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    darkMode?: boolean;
}) {
    const {
        variant,
        icons,
        actions,
        children,
        darkMode,
    } = props;

    const buttonClassName = _cs(
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'action' && styles.action,
        variant === 'transparent' && styles.transparent,
        darkMode && styles.darkMode,
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

export interface Props<N> extends RawButtonProps<N> {
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    variant?: ButtonVariantType;
    disabled?: boolean;
    darkMode?: boolean;
}

function Button<N>(props: Props<N>) {
    const {
        className,
        icons,
        actions,
        children,
        variant = 'primary',
        darkMode,
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
        darkMode,
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

import React from 'react';
import { _cs } from '@togglecorp/fujs';

import RawButton, { Props as RawButtonProps } from '#components/RawButton';

import styles from './styles.css';

interface Props<N> extends RawButtonProps<N> {
    onClick?: (name: N, e: React.MouseEvent<HTMLButtonElement>) => void;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
}

function Button<N>(props: Props<N>) {
    const {
        className,
        icons,
        actions,
        children,
        ...otherProps
    } = props;

    return (
        <RawButton
            className={_cs(styles.button, className)}
            {...otherProps}
        >
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
        </RawButton>
    );
}

export default Button;

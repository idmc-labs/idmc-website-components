import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface Props {
    className?: string;
    label?: React.ReactNode;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    error?: React.ReactNode;
    input?: React.ReactNode;
}

function InputContainer(props: Props) {
    const {
        className,
        label,
        icons,
        input,
        actions,
        error,
    } = props;

    return (
        <div className={_cs(styles.inputContainer, className)}>
            {label && (
                <div className={styles.label}>
                    {label}
                </div>
            )}
            <div className={styles.inputSection}>
                {icons && (
                    <div className={styles.icons}>
                        {icons}
                    </div>
                )}
                <div className={styles.input}>
                    {input}
                </div>
                {actions && (
                    <div className={styles.actions}>
                        {actions}
                    </div>
                )}
            </div>
            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
        </div>
    );
}

export default InputContainer;

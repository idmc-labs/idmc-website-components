import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { TabContext } from '#components/Tabs/TabContext';

import styles from './styles.css';

export interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
    position?: 'left' | 'center' | 'right';
    gap?: boolean;
}

export default function TabList(props: Props) {
    const context = React.useContext(TabContext);
    const {
        variant,
        tabs,
        step: progress,
        disabled,
    } = context;

    const {
        children,
        className,
        gap,
        actions,
        position = 'center',
        ...otherProps
    } = props;

    const steps = tabs.length;

    const progressWidth = React.useMemo(() => {
        if (!steps || !progress) {
            return '0';
        }

        const progressPercentage = Math.max(
            0,
            Math.min(100, 100 * ((progress - 1) / (steps - 1))),
        );

        return `${progressPercentage}%`;
    }, [steps, progress]);

    const stepBorderWidth = React.useMemo(() => {
        if (!steps) {
            return '0';
        }

        return `${100 - 100 / steps}%`;
    }, [steps]);

    return (
        <div
            {...otherProps}
            className={_cs(
                className,
                styles.tabList,
                disabled && styles.disabled,
                // variant === 'primary' && styles.primary,
                variant === 'secondary' && styles.secondary,
            )}
            role="tablist"
        >
            {variant === 'step' && (
                <div
                    style={{ width: stepBorderWidth }}
                    className={styles.stepBorder}
                >
                    <div
                        style={{ width: progressWidth }}
                        className={styles.progress}
                    />
                </div>
            )}
            {variant === 'primary' && gap && (
                <div className={styles.gapDummyElement} />
            )}
            {variant === 'primary' && !actions && (position === 'center' || position === 'right') && (
                <div className={styles.startDummyContent} />
            )}
            { children }
            {variant === 'primary' && (position === 'center' || position === 'left') && (
                <div className={styles.endDummyContent}>
                    {actions}
                </div>
            )}
            {variant === 'primary' && gap && (
                <div className={styles.gapDummyElement} />
            )}
        </div>
    );
}

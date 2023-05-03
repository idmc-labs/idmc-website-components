import React from 'react';
import {
    _cs,
    isDefined,
    bound,
} from '@togglecorp/fujs';

import Numeral from '#components/Numeral';

import styles from './styles.css';

export interface Props {
    className?: string;
    progressClassName?: string;
    title?: string;
    titleClassName?: string;
    value?: number;
    total?: number;
    icon?: React.ReactNode;
    size?: 'small' | 'large';
}

function ProgressLine(props: Props) {
    const {
        className,
        progressClassName,
        titleClassName,
        value = 0,
        total = 0,
        title,
        icon,
        size = 'small',
    } = props;

    const progress = (total > 0) ? ((value / total) * 100) : 0;

    const progressWidth = `${bound(isDefined(progress) ? progress : 0, 0, 100)}%`;

    return (
        <div
            className={_cs(
                styles.progressBar,
                className,
            )}
        >
            <div className={_cs(styles.titleContainer, titleClassName)}>
                <div className={styles.title}>
                    {title}
                </div>
                <Numeral
                    value={value}
                    abbreviate
                />
            </div>
            <div className={styles.bottom}>
                {icon && (
                    <div className={styles.icon}>
                        {icon}
                    </div>
                )}
                <div
                    className={_cs(
                        styles.line,
                        size === 'small' && styles.small,
                        size === 'large' && styles.large,
                    )}
                >
                    <div
                        style={{
                            width: progressWidth,
                        }}
                        className={
                            _cs(
                                styles.progress,
                                progressClassName,
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}

export default ProgressLine;

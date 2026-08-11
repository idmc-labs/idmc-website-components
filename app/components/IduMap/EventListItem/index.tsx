import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';

import styles from './styles.css';

export interface Props {
    className?: string;
    title: string | undefined | null;
    subtitle: string | undefined | null;
    subtitleMonospace?: boolean;
    displacementType: 'conflict' | 'disaster' | null;
    value: number;
    onClick?: () => void;
    selected?: boolean;
}

function EventListItem(props: Props) {
    const {
        className,
        title,
        subtitle,
        subtitleMonospace,
        displacementType,
        value,
        onClick,
        selected,
    } = props;

    const isConflict = displacementType === 'conflict';
    const isDisaster = displacementType === 'disaster';
    const figureColorClassName = _cs(
        isConflict && styles.figureConflict,
        isDisaster && styles.figureDisaster,
    );
    const clickable = isDefined(onClick);

    const rootClassName = _cs(
        styles.eventListItem,
        isConflict && styles.conflict,
        isDisaster && styles.disaster,
        clickable && styles.clickable,
        selected && styles.selected,
        className,
    );

    const content = (
        <>
            <div className={styles.details}>
                <div className={styles.title}>
                    {title}
                </div>
                {subtitle && (
                    <div className={_cs(styles.subtitle, subtitleMonospace && styles.monospace)}>
                        {subtitle}
                    </div>
                )}
            </div>
            <Numeral
                className={styles.value}
                value={value}
                abbreviate
                valueClassName={figureColorClassName}
                abbrClassName={figureColorClassName}
            />
        </>
    );

    if (clickable) {
        return (
            <RawButton
                name={undefined}
                className={rootClassName}
                onClick={onClick}
            >
                {content}
            </RawButton>
        );
    }

    return (
        <div className={rootClassName}>
            {content}
        </div>
    );
}

export default EventListItem;

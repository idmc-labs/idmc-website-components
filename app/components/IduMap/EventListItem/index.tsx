import React from 'react';
import { _cs, isDefined, isTruthyString } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import HTMLOutput from '#components/HTMLOutput';

import styles from './styles.css';

export function toSentenceCase(str: string | null | undefined): string | null | undefined {
    if (!str) return str;
    const sentence = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    // keep all-caps abbreviations in brackets uppercase, e.g. "storm (TC)" -> "Storm (TC)"
    return sentence.replace(/\(([^)]*)\)/g, (_, inner: string, offset: number) => {
        const original = str.slice(offset + 1, offset + 1 + inner.length);
        const letters = original.replace(/[^a-zA-Z]/g, '');
        const isAbbreviation = letters.length > 0 && letters === letters.toUpperCase();
        return `(${isAbbreviation ? original : inner})`;
    });
}

function formatDate(date: string | null | undefined) {
    if (!isTruthyString(date)) {
        return undefined;
    }
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export interface Props {
    className?: string;
    name: number;
    title: string | undefined | null;
    subtitle: string | undefined | null;
    subtitleMonospace?: boolean;
    // the raw IDU displacement type ('Conflict' / 'Disaster' / 'Other')
    displacementType: string | null | undefined;
    value: number;
    onClick?: (name: number) => void;
    selected?: boolean;
    abbreviate?: boolean;
    // when expanded, the excerpt + source render beneath the row (mobile detail view)
    expanded?: boolean;
    excerpt?: string | null;
    source?: string | null;
    date?: string | null;
}

function EventListItem(props: Props) {
    const {
        className,
        name,
        title,
        subtitle,
        subtitleMonospace,
        displacementType,
        value,
        onClick,
        selected,
        abbreviate = true,
        expanded,
        excerpt,
        source,
        date,
    } = props;

    const isConflict = displacementType === 'Conflict';
    const isDisaster = displacementType === 'Disaster';
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
                <div className={styles.title} title={title ?? undefined}>
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
                abbreviate={abbreviate}
                valueClassName={figureColorClassName}
                abbrClassName={figureColorClassName}
            />
        </>
    );

    const row = clickable ? (
        <RawButton
            name={name}
            className={rootClassName}
            onClick={onClick}
        >
            {content}
        </RawButton>
    ) : (
        <div className={rootClassName}>
            {content}
        </div>
    );

    if (!expanded) {
        return row;
    }

    const sourceText = [source, formatDate(date)].filter(isTruthyString).join(' — ');

    return (
        <div
            className={_cs(
                styles.expandable,
                isConflict && styles.conflict,
                isDisaster && styles.disaster,
            )}
        >
            {row}
            <div className={styles.excerpt}>
                {isTruthyString(excerpt) && (
                    <HTMLOutput
                        className={styles.excerptText}
                        value={excerpt}
                    />
                )}
                {isTruthyString(sourceText) && (
                    <div className={styles.excerptSource}>
                        <span className={styles.sourceLabel}>Source</span>
                        {` · ${sourceText}`}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventListItem;

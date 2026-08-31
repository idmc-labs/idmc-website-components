import React, { useState, useCallback } from 'react';
import { _cs, isTruthyString } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import MarkdownViewer from '#components/MarkdownViewer';

import { FigureAnalysisEntry } from '../types';

import styles from '../styles.css';

export interface Props {
    entry: FigureAnalysisEntry & { countryName: string };
    showCountryName: boolean;
    abbreviate: boolean;
}

function FigureAnalysisEntryCard(props: Props) {
    const { entry, showCountryName, abbreviate } = props;

    const [expanded, setExpanded] = useState(false);

    const handleToggle = useCallback(() => {
        setExpanded((prev) => !prev);
    }, []);

    const isConflict = entry.figureCause === 'CONFLICT';

    const title = [
        showCountryName ? entry.countryName : undefined,
        entry.figureCauseDisplay,
        entry.figureCategoryDisplay,
        String(entry.year),
    ].filter(isTruthyString).join(' · ');

    return (
        <div className={styles.entry}>
            <div className={styles.entryHeader}>
                <div className={styles.entryTitle}>
                    {title}
                </div>
                <Numeral
                    className={_cs(
                        styles.entryValue,
                        isConflict ? styles.conflict : styles.disaster,
                    )}
                    value={entry.figuresRounded}
                    abbreviate={abbreviate}
                />
            </div>
            {isTruthyString(entry.description) && (
                <div className={styles.entryBody}>
                    <div className={_cs(styles.entryDescription, !expanded && styles.clamped)}>
                        <MarkdownViewer markdown={entry.description} />
                    </div>
                    <RawButton
                        name={undefined}
                        className={styles.readMore}
                        onClick={handleToggle}
                    >
                        {expanded ? 'Show less' : 'Read full note'}
                    </RawButton>
                </div>
            )}
        </div>
    );
}

export default FigureAnalysisEntryCard;

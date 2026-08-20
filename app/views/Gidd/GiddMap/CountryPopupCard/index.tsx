import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    IoClose,
    IoArrowForward,
} from 'react-icons/io5';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import { getHazardTypeLabel } from '#utils/common';

import {
    Cause,
    Category,
    PointProperties,
    BreakdownDisplayItem,
} from '../types';

import styles from '../styles.css';

export interface Props {
    properties: PointProperties;
    cause: Cause | undefined;
    category: Category | undefined;
    endYear: number;
    detailed: boolean;
    abbreviate: boolean;
    hazardEntries?: BreakdownDisplayItem[];
    violenceEntries?: BreakdownDisplayItem[];
    onCountryFocus?: (iso3: string) => void;
    onClose?: () => void;
}

function CountryPopupCard(props: Props) {
    const {
        properties,
        cause,
        category,
        endYear,
        detailed,
        abbreviate,
        hazardEntries = [],
        violenceEntries = [],
        onCountryFocus,
        onClose,
    } = props;

    const canFocus = isDefined(onCountryFocus);
    const canClose = isDefined(onClose);
    const isStock = category === 'stock';
    const cOn = cause !== 'disaster';
    const dOn = cause !== 'conflict';

    const conflictNew = properties.conflictNew ?? 0;
    const conflictTotal = properties.conflictTotal ?? 0;
    const disasterNew = properties.disasterNew ?? 0;
    const disasterTotal = properties.disasterTotal ?? 0;

    const currentConflict = isStock ? conflictTotal : conflictNew;
    const currentDisaster = isStock ? disasterTotal : disasterNew;
    const currentTotal = (cOn ? currentConflict : 0) + (dOn ? currentDisaster : 0);

    const otherConflict = isStock ? conflictNew : conflictTotal;
    const otherDisaster = isStock ? disasterNew : disasterTotal;
    const otherTotal = (cOn ? otherConflict : 0) + (dOn ? otherDisaster : 0);
    const otherLabel = isStock ? `Internal displacements in ${endYear}` : 'Total IDPs at year end';
    const subtitle = isStock
        ? `IDPs at the end of ${endYear}`
        : `Internal displacements in ${endYear}`;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.title}>
                    {properties.name}
                </div>
                <div className={styles.headerEnd}>
                    <Numeral
                        className={styles.headline}
                        value={currentTotal}
                        abbreviate={abbreviate}
                    />
                    {canClose && (
                        <RawButton
                            name={undefined}
                            className={styles.closeButton}
                            onClick={onClose}
                            title="Close"
                        >
                            <IoClose />
                        </RawButton>
                    )}
                </div>
            </div>
            <div className={styles.cardBody}>
                <div className={styles.subheading}>
                    {subtitle}
                </div>
                <div className={styles.breakdown}>
                    {cOn && (
                        <div className={_cs(styles.breakdownItem, styles.conflict)}>
                            <span className={styles.dot} />
                            <span className={styles.breakdownLabel}>Conflict and violence</span>
                            <Numeral
                                className={styles.breakdownValue}
                                value={currentConflict}
                                abbreviate={abbreviate}
                            />
                        </div>
                    )}
                    {dOn && (
                        <div className={_cs(styles.breakdownItem, styles.disaster)}>
                            <span className={styles.dot} />
                            <span className={styles.breakdownLabel}>Disasters</span>
                            <Numeral
                                className={styles.breakdownValue}
                                value={currentDisaster}
                                abbreviate={abbreviate}
                            />
                        </div>
                    )}
                    <div className={_cs(styles.breakdownItem, styles.neutral)}>
                        <span className={styles.dot} />
                        <span className={styles.breakdownLabel}>{otherLabel}</span>
                        <Numeral
                            className={styles.breakdownValue}
                            value={otherTotal}
                            abbreviate={abbreviate}
                        />
                    </div>
                </div>
                {detailed && (
                    <>
                        {dOn && hazardEntries.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    {`Disasters by hazard type · ${endYear}`}
                                </div>
                                <div className={styles.sectionList}>
                                    {hazardEntries.map((hazard) => (
                                        <div key={hazard.id} className={styles.sectionRow}>
                                            <span>{getHazardTypeLabel(hazard)}</span>
                                            <Numeral
                                                className={styles.disaster}
                                                value={hazard.value}
                                                abbreviate={abbreviate}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {cOn && violenceEntries.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    {`Violence sub types · ${endYear}`}
                                </div>
                                <div className={styles.sectionList}>
                                    {violenceEntries.map((violence) => (
                                        <div key={violence.id} className={styles.sectionRow}>
                                            <span>{violence.label}</span>
                                            <Numeral
                                                className={styles.conflict}
                                                value={violence.value}
                                                abbreviate={abbreviate}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {canFocus && (
                            <RawButton
                                name={undefined}
                                className={styles.focusButton}
                                onClick={() => {
                                    onCountryFocus?.(properties.iso3);
                                    onClose?.();
                                }}
                            >
                                <span className={styles.focusButtonLabel}>
                                    Focus this country or territory in all charts
                                </span>
                                <IoArrowForward className={styles.focusButtonIcon} />
                            </RawButton>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default CountryPopupCard;

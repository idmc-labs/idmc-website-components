import React, { useCallback } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    IoClose,
    IoArrowForward,
} from 'react-icons/io5';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import ListView from '#components/ListView';
import { getHazardTypeLabel } from '#utils/common';

import {
    Cause,
    Category,
    PointProperties,
    BreakdownDisplayItem,
} from '../types';

import styles from '../styles.css';

interface BreakdownRowProps {
    className?: string;
    label: string;
    value: number;
    abbreviate: boolean;
}

function BreakdownRow(props: BreakdownRowProps) {
    const {
        className,
        label,
        value,
        abbreviate,
    } = props;
    return (
        <div className={styles.sectionRow}>
            <span>{label}</span>
            <Numeral
                className={className}
                value={value}
                abbreviate={abbreviate}
            />
        </div>
    );
}

export interface Props {
    properties: PointProperties;
    cause: Cause | undefined;
    category: Category | undefined;
    startYear: number;
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
        startYear,
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

    const hazardKeySelector = useCallback((hazard: BreakdownDisplayItem) => hazard.id, []);
    const hazardRendererParams = useCallback((_: string, hazard: BreakdownDisplayItem) => ({
        className: styles.disaster,
        label: getHazardTypeLabel(hazard),
        value: hazard.value,
        abbreviate,
    }), [abbreviate]);

    const violenceKeySelector = useCallback((violence: BreakdownDisplayItem) => violence.id, []);
    const violenceRendererParams = useCallback((_: string, violence: BreakdownDisplayItem) => ({
        className: styles.conflict,
        label: violence.label,
        value: violence.value,
        abbreviate,
    }), [abbreviate]);
    const isStock = category === 'stock';
    const cOn = cause !== 'disaster';
    const dOn = cause !== 'conflict';

    const conflictNew = properties.conflictNew ?? 0;
    const conflictTotal = properties.conflictTotal ?? 0;
    const disasterNew = properties.disasterNew ?? 0;
    const disasterTotal = properties.disasterTotal ?? 0;

    // The per-cause rows print the API's own rounded figures.
    const currentConflict = isStock ? conflictTotal : conflictNew;
    const currentDisaster = isStock ? disasterTotal : disasterNew;

    // The totals come from the map, which already applied the cause selection and summed
    // from raw figures. Re-adding the rounded rows above would compound their errors, and
    // the headline would then disagree with the bubble it sits on.
    const currentTotal = properties.value;
    const otherTotal = properties.otherValue;
    const displacementsPeriod = startYear === endYear
        ? `in ${endYear}`
        : `from ${startYear} to ${endYear}`;
    const otherLabel = isStock ? `Internal displacements ${displacementsPeriod}` : 'Total IDPs at year end';
    const subtitle = isStock
        ? `IDPs at the end of ${endYear}`
        : `Internal displacements ${displacementsPeriod}`;

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
                                <ListView
                                    className={styles.sectionList}
                                    data={hazardEntries}
                                    keySelector={hazardKeySelector}
                                    renderer={BreakdownRow}
                                    rendererParams={hazardRendererParams}
                                    pending={false}
                                    errored={false}
                                    filtered={false}
                                />
                            </div>
                        )}
                        {cOn && violenceEntries.length > 0 && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>
                                    {`Violence sub types · ${endYear}`}
                                </div>
                                <ListView
                                    className={styles.sectionList}
                                    data={violenceEntries}
                                    keySelector={violenceKeySelector}
                                    renderer={BreakdownRow}
                                    rendererParams={violenceRendererParams}
                                    pending={false}
                                    errored={false}
                                    filtered={false}
                                />
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

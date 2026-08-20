import React, {
    useState,
    useMemo,
    useCallback,
} from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import Message from '#components/Message';

import FigureAnalysisFetcher, { FigureAnalysisEntry } from './FigureAnalysisFetcher';
import FigureAnalysisEntryCard from './FigureAnalysisEntryCard';

import styles from './styles.css';

export interface FigureAnalysisCountry {
    iso3: string;
    name: string;
}

export interface Props {
    className?: string;
    countries: FigureAnalysisCountry[];
    year: number;
    clientCode: string;
    abbreviate: boolean;
}

function FigureAnalysisCard(props: Props) {
    const {
        className,
        countries,
        year,
        clientCode,
        abbreviate,
    } = props;

    const [resultsByIso3, setResultsByIso3] = useState<Record<string, FigureAnalysisEntry[]>>({});
    const [pendingByIso3, setPendingByIso3] = useState<Record<string, boolean>>({});

    const handleResults = useCallback((
        iso3: string,
        results: FigureAnalysisEntry[],
        pending: boolean,
    ) => {
        setResultsByIso3((prev) => ({ ...prev, [iso3]: results }));
        setPendingByIso3((prev) => ({ ...prev, [iso3]: pending }));
    }, []);

    const showCountryName = countries.length > 1;

    const entries = useMemo(() => (
        countries.flatMap((country) => (
            (resultsByIso3[country.iso3] ?? []).map((entry) => ({
                ...entry,
                countryName: country.name,
            }))
        ))
    ), [countries, resultsByIso3]);

    // Any selected country still on its first load, before any entries have
    // arrived at all — once at least one comes in, show what we have rather
    // than blocking on the slowest country.
    const pending = countries.length > 0
        && entries.length === 0
        && countries.some((country) => pendingByIso3[country.iso3] !== false);

    const headingDescription = useMemo(() => {
        if (countries.length === 0) {
            return "IDMC's methodology and caveat notes behind each published figure.";
        }
        if (countries.length === 1) {
            return `IDMC's methodology and caveat notes behind ${countries[0].name}'s published figures.`;
        }
        return "IDMC's methodology and caveat notes behind the selected countries' published figures.";
    }, [countries]);

    return (
        <div className={_cs(styles.figureAnalysisCard, className)}>
            {countries.map((country) => (
                <FigureAnalysisFetcher
                    key={country.iso3}
                    iso3={country.iso3}
                    year={year}
                    clientCode={clientCode}
                    onResults={handleResults}
                />
            ))}
            <Header
                heading="Figure analysis"
                headingSize="small"
                headingDescription={headingDescription}
                headingDescriptionClassName={styles.description}
            />
            {pending ? (
                <Message pending compact />
            ) : (
                <>
                    {countries.length === 0 && (
                        <div className={styles.placeholder}>
                            <div className={styles.placeholderTitle}>
                                Select a country or territory
                            </div>
                            <div className={styles.placeholderText}>
                                Pick a country or territory in the filter bar to
                                read IDMC&apos;s methodology and caveat notes behind
                                its published figures.
                            </div>
                        </div>
                    )}
                    {countries.length > 0 && entries.length === 0 && (
                        <div className={styles.placeholder}>
                            <div className={styles.placeholderText}>
                                No published figure analysis for the selected year.
                            </div>
                        </div>
                    )}
                    {entries.length > 0 && (
                        <div className={styles.list}>
                            {entries.map((entry) => (
                                <FigureAnalysisEntryCard
                                    key={entry.id}
                                    entry={entry}
                                    showCountryName={showCountryName}
                                    abbreviate={abbreviate}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default FigureAnalysisCard;

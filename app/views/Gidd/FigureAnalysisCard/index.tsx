import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
} from 'react';
import { _cs, isTruthyString } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import Header from '#components/Header';
import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import MarkdownViewer from '#components/MarkdownViewer';
import { DATA_RELEASE } from '#utils/common';
import {
    GiddCountryPfaQuery,
    GiddCountryPfaQueryVariables,
} from '#generated/types';

import styles from './styles.css';

// Reuses GiddCountryPfaQuery/GiddCountryPfaQueryVariables (generated for
// FigureAnalysis's own GiddCountryPfa operation) since the field selection
// here is identical — no codegen access from this environment to generate a
// dedicated type for a differently-named operation.
const GIDD_COUNTRY_FIGURE_ANALYSIS = gql`
    query GiddDashboardFigureAnalysis(
        $iso3: String!,
        $year: Int!,
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicFigureAnalysisList(
            filters: {
                iso3: $iso3,
                year: $year,
                releaseEnvironment: $releaseEnvironment,
            },
            clientId: $clientId,
        ) {
            results {
                id
                description
                figureCategory
                figureCategoryDisplay
                figureCause
                figureCauseDisplay
                figuresRounded
                iso3
                year
            }
        }
    }
`;

type FigureAnalysisEntry = NonNullable<
    NonNullable<GiddCountryPfaQuery['giddPublicFigureAnalysisList']>['results']
>[number];

interface FetcherProps {
    iso3: string;
    year: number;
    clientCode: string;
    onResults: (iso3: string, results: FigureAnalysisEntry[]) => void;
}

// Fetches one country's figure analysis and reports it up to the parent;
// the underlying query only accepts a single iso3, so a multi-country
// selection is rendered as one invisible fetcher per country.
function FigureAnalysisFetcher(props: FetcherProps) {
    const {
        iso3,
        year,
        clientCode,
        onResults,
    } = props;

    const variables = useMemo(() => ({
        iso3,
        year,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [iso3, year, clientCode]);

    const {
        previousData,
        data = previousData,
    } = useQuery<GiddCountryPfaQuery, GiddCountryPfaQueryVariables>(
        GIDD_COUNTRY_FIGURE_ANALYSIS,
        {
            variables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const results = data?.giddPublicFigureAnalysisList?.results;

    useEffect(() => {
        onResults(iso3, results ?? []);
    }, [iso3, results, onResults]);

    return null;
}

interface EntryCardProps {
    entry: FigureAnalysisEntry & { countryName: string };
    showCountryName: boolean;
}

function FigureAnalysisEntryCard(props: EntryCardProps) {
    const { entry, showCountryName } = props;

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
                    abbreviate
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

export interface FigureAnalysisCountry {
    iso3: string;
    name: string;
}

export interface Props {
    className?: string;
    countries: FigureAnalysisCountry[];
    year: number;
    clientCode: string;
}

function FigureAnalysisCard(props: Props) {
    const {
        className,
        countries,
        year,
        clientCode,
    } = props;

    const [resultsByIso3, setResultsByIso3] = useState<Record<string, FigureAnalysisEntry[]>>({});

    const handleResults = useCallback((iso3: string, results: FigureAnalysisEntry[]) => {
        setResultsByIso3((prev) => ({ ...prev, [iso3]: results }));
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
                headingSize="medium"
                headingDescription={headingDescription}
            />
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default FigureAnalysisCard;

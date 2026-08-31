import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import { Pager } from '@togglecorp/toggle-ui';

import Header from '#components/Header';
import Message from '#components/Message';
import ListView from '#components/ListView';
import { joinWithAnd } from '#utils/strings';
import { DATA_RELEASE } from '#utils/common';
import { GiddPublicFigureAnalysisType } from '#generated/types';

import FigureAnalysisEntryCard from './FigureAnalysisEntryCard';
import { FigureAnalysisEntry } from './types';

import styles from './styles.css';

export const FIGURE_ANALYSIS_PAGE_SIZE = 10;

const GIDD_COUNTRY_FIGURE_ANALYSIS = gql`
    query GiddDashboardFigureAnalysis(
        $countriesIso3: [String!],
        $year: Int!,
        $releaseEnvironment: String!,
        $clientId: String!,
        $page: Int,
        $pageSize: Int,
    ){
        giddPublicFigureAnalysisList(
            filters: {
                countriesIso3: $countriesIso3,
                year: $year,
                releaseEnvironment: $releaseEnvironment,
            },
            clientId: $clientId,
            page: $page,
            pageSize: $pageSize,
        ) {
            results {
                id
                description
                figureCategory
                figureCategoryDisplay
                figureCause
                figureCauseDisplay
                figures
                figuresRounded
                iso3
                year
            }
            totalCount
        }
    }
`;

interface GiddDashboardFigureAnalysisQueryVariables {
    countriesIso3: string[];
    year: number;
    releaseEnvironment: string;
    clientId: string;
    page: number;
    pageSize: number;
}

interface GiddDashboardFigureAnalysisQuery {
    giddPublicFigureAnalysisList?: {
        results?: GiddPublicFigureAnalysisType[];
        totalCount?: number;
    };
}

export interface FigureAnalysisCountry {
    iso3: string;
    name: string;
}

type Category = 'flow' | 'stock';

export interface Props {
    className?: string;
    countries: FigureAnalysisCountry[];
    scopeNames: string[];
    category: Category | undefined;
    year: number;
    clientCode: string;
    abbreviate: boolean;
}

function FigureAnalysisCard(props: Props) {
    const {
        className,
        countries,
        scopeNames,
        category,
        year,
        clientCode,
        abbreviate,
    } = props;

    const [activePage, setActivePage] = useState(1);

    const iso3s = useMemo(() => countries.map((country) => country.iso3), [countries]);

    useEffect(() => {
        setActivePage(1);
    }, [iso3s, year]);

    const variables = useMemo(() => ({
        countriesIso3: iso3s,
        year,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
        page: activePage,
        pageSize: FIGURE_ANALYSIS_PAGE_SIZE,
    }), [iso3s, year, clientCode, activePage]);

    const {
        previousData,
        data = previousData,
        loading,
    } = useQuery<GiddDashboardFigureAnalysisQuery, GiddDashboardFigureAnalysisQueryVariables>(
        GIDD_COUNTRY_FIGURE_ANALYSIS,
        {
            variables,
            skip: iso3s.length === 0,
            context: {
                clientName: 'helix',
            },
        },
    );

    const analyses = data?.giddPublicFigureAnalysisList?.results;
    const totalCount = data?.giddPublicFigureAnalysisList?.totalCount ?? 0;
    const pending = loading && !data;

    const showCountryName = countries.length > 1;

    const countryNameByIso3 = useMemo(() => (
        new Map(countries.map((country) => [country.iso3, country.name]))
    ), [countries]);

    const entries = useMemo(() => (
        (analyses ?? []).map((entry: FigureAnalysisEntry) => ({
            ...entry,
            countryName: countryNameByIso3.get(entry.iso3) ?? entry.iso3,
        }))
    ), [analyses, countryNameByIso3]);

    const entryKeySelector = useCallback((entry: typeof entries[number]) => entry.id, []);
    const entryRendererParams = useCallback((_: string, entry: typeof entries[number]) => ({
        entry,
        showCountryName,
        abbreviate,
    }), [showCountryName, abbreviate]);

    const showPending = pending && entries.length === 0;

    const headingDescription = useMemo(() => {
        if (scopeNames.length === 0) {
            return "IDMC's methodology and caveat notes behind each published figure.";
        }
        const metricWord = category === 'stock' ? 'IDPs' : 'internal displacements';
        return `Methodology and caveats behind ${joinWithAnd(scopeNames)}'s figures for ${metricWord}.`;
    }, [scopeNames, category]);

    return (
        <div className={_cs(styles.figureAnalysisCard, className)}>
            <Header
                heading="Figure analysis"
                headingClassName={styles.slideHeading}
                headingSize="small"
                headingDescription={headingDescription}
                headingDescriptionClassName={styles.description}
            />
            <div className={styles.body}>
                {showPending ? (
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
                            <>
                                <ListView
                                    className={styles.list}
                                    data={entries}
                                    keySelector={entryKeySelector}
                                    renderer={FigureAnalysisEntryCard}
                                    rendererParams={entryRendererParams}
                                    pending={false}
                                    errored={false}
                                    filtered={false}
                                />
                                <Pager
                                    className={styles.pager}
                                    activePage={activePage}
                                    itemsCount={totalCount}
                                    maxItemsPerPage={FIGURE_ANALYSIS_PAGE_SIZE}
                                    onActivePageChange={setActivePage}
                                    itemsPerPageControlHidden
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default FigureAnalysisCard;

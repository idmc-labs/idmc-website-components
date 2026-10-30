import React, {
    useMemo,
    useCallback,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    NetworkStatus,
} from '@apollo/client';

import Header from '#components/Header';
import Message from '#components/Message';
import ListView from '#components/ListView';
import RawButton from '#components/RawButton';
import { DATA_RELEASE } from '#utils/common';
import { joinWithAnd } from '#utils/strings';
import {
    GiddDashboardFigureAnalysisQuery,
    GiddDashboardFigureAnalysisQueryVariables,
} from '#generated/types';

import FigureAnalysisEntryCard from './FigureAnalysisEntryCard';

import styles from './styles.css';

const GIDD_FIGURE_ANALYSIS = gql`
    query GiddDashboardFigureAnalysis(
        $countriesIso3: [String!],
        $year: Int!,
        $page: Int,
        $pageSize: Int,
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicFigureAnalysisList(
            filters: {
                countriesIso3: $countriesIso3,
                year: $year,
                releaseEnvironment: $releaseEnvironment,
            },
            page: $page,
            pageSize: $pageSize,
            clientId: $clientId,
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

const FIGURE_ANALYSIS_PAGE_SIZE = 25;

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

    const variables = useMemo((): GiddDashboardFigureAnalysisQueryVariables => ({
        countriesIso3: countries.map((country) => country.iso3),
        year,
        page: 1,
        pageSize: FIGURE_ANALYSIS_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [countries, year, clientCode]);

    const {
        data,
        loading,
        networkStatus,
        fetchMore,
    } = useQuery<GiddDashboardFigureAnalysisQuery, GiddDashboardFigureAnalysisQueryVariables>(
        GIDD_FIGURE_ANALYSIS,
        {
            variables,
            skip: countries.length === 0,
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
            context: {
                clientName: 'helix',
            },
        },
    );

    const results = data?.giddPublicFigureAnalysisList?.results;
    const totalCount = data?.giddPublicFigureAnalysisList?.totalCount ?? 0;

    const showCountryName = countries.length > 1;

    const entries = useMemo(() => {
        const countryNameByIso3 = new Map(
            countries.map((country) => [country.iso3, country.name]),
        );
        return (results ?? []).map((entry) => ({
            ...entry,
            countryName: countryNameByIso3.get(entry.iso3) ?? entry.iso3,
        }));
    }, [countries, results]);

    const loadedCount = results?.length ?? 0;
    const hasMore = loadedCount < totalCount;
    const loadingMore = networkStatus === NetworkStatus.fetchMore;

    const handleShowMore = useCallback(() => {
        fetchMore({
            variables: {
                page: Math.floor(loadedCount / FIGURE_ANALYSIS_PAGE_SIZE) + 1,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                const previousList = previousResult.giddPublicFigureAnalysisList;
                const nextList = fetchMoreResult?.giddPublicFigureAnalysisList;
                if (!previousList || !nextList) {
                    return previousResult;
                }
                return {
                    ...previousResult,
                    giddPublicFigureAnalysisList: {
                        ...nextList,
                        results: [
                            ...previousList.results ?? [],
                            ...nextList.results ?? [],
                        ],
                    },
                };
            },
        });
    }, [fetchMore, loadedCount]);

    const entryKeySelector = useCallback((entry: typeof entries[number]) => entry.id, []);
    const entryRendererParams = useCallback((_: string, entry: typeof entries[number]) => ({
        entry,
        showCountryName,
        abbreviate,
    }), [showCountryName, abbreviate]);

    const pending = countries.length > 0 && loading && !loadingMore;

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
                        )}
                        {hasMore && (
                            <RawButton
                                name={undefined}
                                className={styles.showMore}
                                onClick={handleShowMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Loading…' : 'Show more'}
                            </RawButton>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default FigureAnalysisCard;

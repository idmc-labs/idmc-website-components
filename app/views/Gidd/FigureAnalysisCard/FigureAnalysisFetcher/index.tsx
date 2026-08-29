import { useMemo, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';

import { DATA_RELEASE } from '#utils/common';
import {
    GiddDashboardFigureAnalysisQuery,
    GiddDashboardFigureAnalysisQueryVariables,
} from '#generated/types';

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

export type FigureAnalysisEntry = NonNullable<
    NonNullable<GiddDashboardFigureAnalysisQuery['giddPublicFigureAnalysisList']>['results']
>[number];

export interface Props {
    iso3: string;
    year: number;
    clientCode: string;
    onResults: (iso3: string, results: FigureAnalysisEntry[], pending: boolean) => void;
}

function FigureAnalysisFetcher(props: Props) {
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
        loading,
    } = useQuery<GiddDashboardFigureAnalysisQuery, GiddDashboardFigureAnalysisQueryVariables>(
        GIDD_COUNTRY_FIGURE_ANALYSIS,
        {
            variables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const results = data?.giddPublicFigureAnalysisList?.results;
    const pending = loading && !data;

    useEffect(() => {
        onResults(iso3, results ?? [], pending);
    }, [iso3, results, pending, onResults]);

    return null;
}

export default FigureAnalysisFetcher;

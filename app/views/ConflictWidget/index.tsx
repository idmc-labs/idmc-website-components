import React, { useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoDownloadOutline,
    IoExitOutline,
} from 'react-icons/io5';
import {
    ResponsiveContainer,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
    LineChart,
    Line,
} from 'recharts';

import ButtonLikeLink from '#components/ButtonLikeLink';
import Header from '#components/Header';
import ErrorBoundary from '#components/ErrorBoundary';
import Infographic from '#components/Infographic';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';
import TooltipIcon from '#components/TooltipIcon';

import {
    formatNumber,
    START_YEAR,
    suffixDrupalEndpoint,
    suffixHelixRestEndpoint,
    DATA_RELEASE,
    prepareUrl,
} from '#utils/common';
import {
    ConflictDataQuery,
    ConflictDataQueryVariables,
    ConflictStatsQuery,
    ConflictStatsQueryVariables,
} from '#generated/types';

import { countryMetadata } from '../CountryProfile/data';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import styles from './styles.css';

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const giddDisplacementDataLink = suffixDrupalEndpoint('/database/displacement-data');

const STATS = gql`
    query ConflictStats(
        $iso3: String!,
        $startYear: Float,
        $endYear: Float,
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddPublicConflictStatistics(
            countriesIso3: [$iso3],
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            newDisplacementsRounded
            totalDisplacementsRounded
        }
    }
`;

const CONFLICT_DATA = gql`
    query ConflictData(
        $countryIso3: String!,
        $startYear: Float,
        $endYear: Float,
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddPublicConflictStatistics(
            countriesIso3: [$countryIso3],
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            newDisplacementsRounded
            totalDisplacementsRounded
            totalDisplacementTimeseriesByYear {
                year
                totalRounded
            }
            newDisplacementTimeseriesByYear {
                year
                totalRounded
            }
        }
    }
`;

export interface Props {
    iso3: string;
    endYear: number;
    clientCode: string;
}

function ConflictWidget(props: Props) {
    const { iso3, endYear: year, clientCode } = props;

    const [conflictTimeRangeActual, setConflictTimeRange] = useState([START_YEAR, year]);
    const conflictTimeRange = useDebouncedValue(conflictTimeRangeActual);

    const {
        previousData: previousStatsData,
        data: statsData = previousStatsData,
        // TODO: handle loading and error
        // loading: countryProfileLoading,
        // error: countryProfileError,
    } = useQuery<ConflictStatsQuery, ConflictStatsQueryVariables>(
        STATS,
        {
            variables: {
                iso3,
                startYear: START_YEAR,
                endYear: year,
                releaseEnvironment: DATA_RELEASE,
                clientId: clientCode,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const {
        previousData: previousConflictData,
        data: conflictData = previousConflictData,
        // TODO: handle loading and error
        // loading: conflictDataLoading,
        // error: conflictDataError,
    } = useQuery<ConflictDataQuery, ConflictDataQueryVariables>(
        CONFLICT_DATA,
        {
            variables: {
                countryIso3: iso3,
                startYear: conflictTimeRange[0],
                endYear: conflictTimeRange[1],
                releaseEnvironment: DATA_RELEASE,
                clientId: clientCode,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    if ((
        (statsData?.giddPublicConflictStatistics?.newDisplacementsRounded ?? 0)
        + (statsData?.giddPublicConflictStatistics?.totalDisplacementsRounded ?? 0)
    ) <= 0) {
        return null;
    }

    return (
        <Container
            heading={countryMetadata.conflictAndViolenceHeader}
            headingSize="small"
            headerClassName={styles.conflictHeader}
            headingClassName={styles.conflictHeading}
            headingInfo={(
                <TooltipIcon>
                    {countryMetadata.conflictAndViolenceTooltip}
                </TooltipIcon>
            )}
            filters={(
                <>
                    <SliderInput
                        className={styles.timeRangeContainer}
                        hideValues
                        min={START_YEAR}
                        labelDescription={`${conflictTimeRangeActual[0]} - ${conflictTimeRangeActual[1]}`}
                        max={year}
                        step={1}
                        minDistance={0}
                        value={conflictTimeRangeActual}
                        onChange={setConflictTimeRange}
                    />
                    <div />
                    <div />
                </>
            )}
            footerActions={(
                <>
                    <ButtonLikeLink
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/displacements/displacement-export/',
                            {
                                iso3__in: iso3,
                                start_year: conflictTimeRange[0],
                                end_year: conflictTimeRange[1],
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.conflictButton}
                        icons={(
                            <IoDownloadOutline />
                        )}
                    >
                        Download Conflict Data
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        href={giddDisplacementDataLink}
                        className={styles.conflictButton}
                        icons={(
                            <IoExitOutline />
                        )}
                    >
                        Go to IDMC&apos;s database
                    </ButtonLikeLink>
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={
                        conflictData?.giddPublicConflictStatistics.newDisplacementsRounded || 0
                    }
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Internal Displacements"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.conflictInternalDisplacementTooltip}
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`${conflictTimeRangeActual[0]} - ${conflictTimeRangeActual[1]}`}
                    chart={
                        conflictData
                            ?.giddPublicConflictStatistics.newDisplacementTimeseriesByYear && (
                            <ErrorBoundary>
                                <ResponsiveContainer>
                                    <BarChart
                                        data={(
                                            conflictData
                                                ?.giddPublicConflictStatistics
                                                .newDisplacementTimeseriesByYear
                                        )}
                                        margin={chartMargins}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            strokeDasharray="3 3"
                                        />
                                        <XAxis
                                            dataKey="year"
                                            axisLine={false}
                                            type="number"
                                            allowDecimals={false}
                                            padding={{ left: 20, right: 20 }}
                                            domain={conflictTimeRange}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickFormatter={formatNumber}
                                        />
                                        <Tooltip
                                            formatter={formatNumber}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="totalRounded"
                                            name="Internal Displacements"
                                            fill="var(--color-conflict)"
                                            maxBarSize={6}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ErrorBoundary>
                        )
                    }
                />
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={
                        conflictData?.giddPublicConflictStatistics.totalDisplacementsRounded || 0
                    }
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Internally displaced people (IDPs)"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.conflictIDPTooltip}
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`As of end of ${conflictTimeRangeActual[1]}`}
                    chart={
                        conflictData
                            ?.giddPublicConflictStatistics
                            .totalDisplacementTimeseriesByYear
                        && (
                            <ErrorBoundary>
                                <ResponsiveContainer>
                                    <LineChart
                                        data={(conflictData
                                            .giddPublicConflictStatistics
                                            .totalDisplacementTimeseriesByYear
                                        )}
                                        margin={chartMargins}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            strokeDasharray="3 3"
                                        />
                                        <XAxis
                                            dataKey="year"
                                            axisLine={false}
                                            type="number"
                                            allowDecimals={false}
                                            padding={{ left: 20, right: 20 }}
                                            domain={conflictTimeRange}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickFormatter={formatNumber}
                                        />
                                        <Tooltip
                                            formatter={formatNumber}
                                        />
                                        <Legend />
                                        <Line
                                            dataKey="totalRounded"
                                            stroke="var(--color-conflict)"
                                            name="Internally displaced people (IDPs)"
                                            strokeWidth={2}
                                            connectNulls
                                            dot
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ErrorBoundary>
                        )
                    }
                />
            </div>
        </Container>
    );
}
export default ConflictWidget;

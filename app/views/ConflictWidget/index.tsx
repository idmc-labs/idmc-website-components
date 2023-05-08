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
    query ConflictStats($iso3: String!, $startYear: Float, $endYear: Float, $releaseEnvironment: String!) {
        giddConflictStatistics(countriesIso3: [$iso3], endYear: $endYear, startYear: $startYear, releaseEnvironment: $releaseEnvironment) {
            newDisplacements
            totalDisplacements
        }
    }
`;

const CONFLICT_DATA = gql`
    query ConflictData($countryIso3: String!, $startYear: Float, $endYear: Float, $releaseEnvironment: String!) {
        giddConflictStatistics(countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear, releaseEnvironment: $releaseEnvironment) {
            newDisplacements
            totalDisplacements
            totalDisplacementTimeseriesByYear {
                year
                total
            }
            newDisplacementTimeseriesByYear {
                year
                total
            }
        }
    }
`;

export interface Props {
    iso3: string;
    endYear: number;
}

function ConflictWidget(props: Props) {
    const { iso3, endYear: year } = props;

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
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    if ((
        (statsData?.giddConflictStatistics?.newDisplacements ?? 0)
        + (statsData?.giddConflictStatistics?.totalDisplacements ?? 0)
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
                        href={suffixHelixRestEndpoint(`/countries/${iso3}/conflict-export/?start_year=${conflictTimeRange[0]}&end_year=${conflictTimeRange[1]}`)}
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
                        Go to our Data Centre (GIDD)
                    </ButtonLikeLink>
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.giddConflictStatistics.newDisplacements || 0}
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
                    chart={conflictData?.giddConflictStatistics.newDisplacementTimeseriesByYear && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <BarChart
                                    data={(
                                        conflictData
                                            ?.giddConflictStatistics
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
                                        dataKey="total"
                                        name="Internal Displacements"
                                        fill="var(--color-conflict)"
                                        maxBarSize={6}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                />
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.giddConflictStatistics.totalDisplacements || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Total Number of IDPs"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.conflictIDPTooltip}
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`As of end of ${conflictTimeRangeActual[1]}`}
                    chart={conflictData
                        ?.giddConflictStatistics.totalDisplacementTimeseriesByYear && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <LineChart
                                    data={(conflictData
                                        .giddConflictStatistics
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
                                        dataKey="total"
                                        stroke="var(--color-conflict)"
                                        name="Total Number of IDPs"
                                        strokeWidth={2}
                                        connectNulls
                                        dot
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                />
            </div>
        </Container>
    );
}
export default ConflictWidget;

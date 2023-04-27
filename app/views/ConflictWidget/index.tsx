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
import RoundedBar from '#components/RoundedBar';
import ErrorBoundary from '#components/ErrorBoundary';
import Infographic from '#components/Infographic';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';
import TooltipIcon from '#components/TooltipIcon';

import {
    formatNumber,
    START_YEAR,
    END_YEAR,
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

const HELIX_REST_ENDPOINT = process.env.REACT_APP_HELIX_REST_ENDPOINT as string;
const HELIX_CLIENT_ID = process.env.REACT_APP_HELIX_CLIENT_ID as string || '';
const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

function suffixHelixRestEndpoint(path: string) {
    return `${HELIX_REST_ENDPOINT}${path}`;
}
function suffixDrupalEndpoint(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}

const giddDisplacementDataLink = suffixDrupalEndpoint('/database/displacement-data');

const STATS = gql`
    query ConflictStats($iso3: String!, $startYear: Float, $endYear: Float) {
        giddConflictStatistics(countriesIso3: [$iso3], endYear: $endYear, startYear: $startYear) {
            newDisplacements
            totalIdps
        }
    }
`;

const CONFLICT_DATA = gql`
    query ConflictData($countryIso3: String!, $startYear: Float, $endYear: Float) {
        giddConflictStatistics(countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear) {
            newDisplacements
            totalIdps
            idpsTimeseries {
                year
                total
            }
            newDisplacementTimeseries {
                year
                total
            }
        }
    }
`;

interface ConflictProps {
    iso3: string;
}

function ConflictWidget(props: ConflictProps) {
    const { iso3 } = props;

    const [conflictTimeRangeActual, setConflictTimeRange] = useState([START_YEAR, END_YEAR]);
    const conflictTimeRange = useDebouncedValue(conflictTimeRangeActual);

    const {
        previousData: previousStatsData,
        data: statsData = previousStatsData,
        // FIXME: handle loading and error
        // loading: countryProfileLoading,
        // error: countryProfileError,
    } = useQuery<ConflictStatsQuery, ConflictStatsQueryVariables>(
        STATS,
        {
            variables: {
                iso3,
                startYear: START_YEAR,
                endYear: END_YEAR,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const {
        previousData: previousConflictData,
        data: conflictData = previousConflictData,
        // FIXME: handle loading and error
        // loading: conflictDataLoading,
        // error: conflictDataError,
    } = useQuery<ConflictDataQuery, ConflictDataQueryVariables>(
        CONFLICT_DATA,
        {
            variables: {
                countryIso3: iso3,
                startYear: conflictTimeRange[0],
                endYear: conflictTimeRange[1],
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    if ((
        (statsData?.giddConflictStatistics?.newDisplacements ?? 0)
        + (statsData?.giddConflictStatistics?.totalIdps ?? 0)
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
                        max={END_YEAR}
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
                        href={suffixHelixRestEndpoint(`/countries/${iso3}/conflict-export/?start_year=${conflictTimeRange[0]}&end_year=${conflictTimeRange[1]}&client_id=${HELIX_CLIENT_ID}`)}
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
                    chart={conflictData?.giddConflictStatistics.newDisplacementTimeseries && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <LineChart
                                    data={
                                        conflictData
                                            ?.giddConflictStatistics.newDisplacementTimeseries
                                    }
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
                                        name="Internal Displacements"
                                        strokeWidth={2}
                                        connectNulls
                                        dot
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                />
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.giddConflictStatistics.totalIdps || 0}
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
                    chart={conflictData?.giddConflictStatistics.idpsTimeseries && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <BarChart
                                    data={conflictData.giddConflictStatistics.idpsTimeseries}
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
                                        name="Total Number of IDPs"
                                        fill="var(--color-conflict)"
                                        shape={<RoundedBar />}
                                        maxBarSize={6}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                />
            </div>
        </Container>
    );
}
export default ConflictWidget;
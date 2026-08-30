import React, { useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoExitOutline,
    IoInformationCircleOutline,
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
import { PopupButton } from '@togglecorp/toggle-ui';

import ButtonLikeLink from '#components/ButtonLikeLink';
import Header from '#components/Header';
import ErrorBoundary from '#components/ErrorBoundary';
import Infographic from '#components/Infographic';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';
import TooltipIcon from '#components/TooltipIcon';
import Message from '#components/Message';

import {
    formatNumber,
    START_YEAR,
    suffixDrupalEndpoint,
    suffixHelixRestEndpoint,
    DATA_RELEASE,
    prepareUrl,
    isDisaggregationAvailable,
} from '#utils/common';
import {
    ConflictDataQuery,
    ConflictDataQueryVariables,
    ConflictStatsQuery,
    ConflictStatsQueryVariables,
} from '#generated/types';

import useYear from '#hooks/useYear';
import { countryMetadata } from '../CountryProfile/data';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import styles from './styles.css';

const CONFLICT = 'conflict';
const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const giddDisplacementDataLink = suffixDrupalEndpoint('/database/displacement-data');

const STATS = gql`
    query ConflictStats(
        $iso3: String!,
        $startYear: Int,
        $endYear: Int,
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
        $startYear: Int,
        $endYear: Int,
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

    const disaggregationAvailable = isDisaggregationAvailable({
        filterStartYear: conflictTimeRangeActual[0],
        filterEndYear: conflictTimeRangeActual[1],
    });

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
                        transparent
                        href={giddDisplacementDataLink}
                        icons={(
                            <IoExitOutline />
                        )}
                    >
                        Go to IDMC&apos;s database
                    </ButtonLikeLink>
                    <PopupButton
                        className={styles.exportButton}
                        popupClassName={styles.popup}
                        label="Download dataset"
                        name="download"
                        variant="primary"
                        persistent={false}
                        compact
                    >
                        <ButtonLikeLink
                            target="_blank"
                            transparent
                            rel="noopener noreferrer"
                            actions={(
                                <IoInformationCircleOutline
                                    title="Annual updates of internal displacement data related to conflict"
                                />
                            )}
                            href={suffixHelixRestEndpoint(prepareUrl(
                                'gidd/displacements/displacement-export/',
                                {
                                    iso3__in: iso3,
                                    start_year: conflictTimeRange[0],
                                    end_year: conflictTimeRange[1],
                                    cause: CONFLICT,
                                },
                            ), clientCode)}
                        >
                            Conflict annual aggregated data (.xlsx)
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            target="_blank"
                            rel="noopener noreferrer"
                            transparent
                            disabled={!disaggregationAvailable}
                            actions={(
                                <IoInformationCircleOutline
                                    title={`${conflictTimeRangeActual[1]} Conflict disaggregated caseloads`}
                                />
                            )}
                            href={suffixHelixRestEndpoint(prepareUrl(
                                'gidd/disaggregations/disaggregation-export/',
                                {
                                    iso3__in: iso3,
                                    cause: CONFLICT,
                                    start_year: conflictTimeRangeActual[0],
                                    end_year: conflictTimeRangeActual[1],
                                },
                            ), clientCode)}
                        >
                            {`Conflict disaggregated data ${conflictTimeRangeActual[1]} (.xlsx)`}
                        </ButtonLikeLink>
                        <ButtonLikeLink
                            disabled={!disaggregationAvailable}
                            target="_blank"
                            rel="noopener noreferrer"
                            transparent
                            actions={(
                                <IoInformationCircleOutline
                                    title={`${conflictTimeRangeActual[1]} Conflict disaggregated caseloads (geojson) formatted for GIS applications.\nIMPORTANT: Please read the metadata in the geojson`}
                                />
                            )}
                            href={suffixHelixRestEndpoint(prepareUrl(
                                'gidd/disaggregations/disaggregation-geojson/',
                                {
                                    iso3__in: iso3,
                                    cause: CONFLICT,
                                    start_year: conflictTimeRangeActual[0],
                                    end_year: conflictTimeRangeActual[1],
                                },
                            ), clientCode)}
                        >
                            {`Conflict disaggregated data ${conflictTimeRangeActual[1]} (.geojson)`}
                        </ButtonLikeLink>
                        {!disaggregationAvailable && (
                            <p className={styles.exportMessage}>
                                Note: Disaggregated data can only be downloaded one
                                year at a time, and is only available for 2023 onwards.
                            </p>
                        )}
                    </PopupButton>
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
export function ConflictWidgetWithYear(props: Omit<Props, 'endYear'>) {
    // eslint-disable-next-line react/destructuring-assignment
    const { loading, year, error } = useYear(props.clientCode);
    if (loading) {
        return null;
    }
    if (error || !year) {
        return (
            <Message message="Some error occurred!" />
        );
    }
    return (
        <ConflictWidget
            {...props}
            endYear={year}
        />
    );
}

export default ConflictWidget;

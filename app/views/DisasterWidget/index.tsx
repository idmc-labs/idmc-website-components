import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoDownloadOutline,
    IoExitOutline,
} from 'react-icons/io5';
import {
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
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
    HELIX_CLIENT_ID,
    getHazardTypeLabel,
    prepareUrl,
} from '#utils/common';
import {
    DisasterDataQuery,
    DisasterDataQueryVariables,
    DisasterStatsQuery,
    DisasterStatsQueryVariables,
} from '#generated/types';

import { countryMetadata } from '../CountryProfile/data';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import styles from './styles.css';

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const disasterTypeKeySelector = (d: { id: string, label: string }) => d.id;
const disasterTypeLabelSelector = (d: { id: string, label: string }) => getHazardTypeLabel(d);

const giddDisplacementDataLink = suffixDrupalEndpoint('/database/displacement-data');
const categoricalColorScheme = [
    'rgb(6, 23, 158)',
    'rgb(8, 56, 201)',
    'rgb(8, 116, 226)',
    'rgb(1, 142, 202)',
    'rgb(45, 183, 226)',
    'rgb(94, 217, 238)',
];

const STATS = gql`
    query DisasterStats(
        $iso3: String!,
        $startYear: Float,
        $endYear: Float,
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddDisasterStatistics(
            countriesIso3: [$iso3],
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            newDisplacementsRounded
            displacementsByHazardType {
                id
                label
                newDisplacementsRounded
            }
        }
    }
`;

const DISASTER_DATA = gql`
    query DisasterData(
        $countryIso3: String!,
        $startYear: Float,
        $endYear: Float,
        $categories: [ID!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddDisasterStatistics(
            countriesIso3: [$countryIso3],
            endYear: $endYear,
            startYear: $startYear,
            hazardTypes: $categories,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            newDisplacementsRounded
            totalEvents
            newDisplacementTimeseriesByYear {
                totalRounded
                year
            }
            displacementsByHazardType {
                id
                label
                newDisplacementsRounded
            }
        }
    }
`;

export interface Props {
    iso3: string;
    endYear: number;
}

function DisasterWidget(props: Props) {
    const { iso3, endYear: year } = props;
    // Disaster section
    const [disasterTypes, setDisasterTypes] = useState<string[]>([]);
    const [disasterTimeRangeActual, setDisasterTimeRange] = useState([START_YEAR, year]);
    const disasterTimeRange = useDebouncedValue(disasterTimeRangeActual);

    const {
        previousData: previousStatsData,
        data: statsData = previousStatsData,
        // FIXME: handle loading and error
        // loading: countryProfileLoading,
        // error: countryProfileError,
    } = useQuery<DisasterStatsQuery, DisasterStatsQueryVariables>(
        STATS,
        {
            variables: {
                iso3,
                startYear: START_YEAR,
                endYear: year,
                releaseEnvironment: DATA_RELEASE,
                clientId: HELIX_CLIENT_ID,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const {
        previousData: previousDisasterData,
        data: disasterData = previousDisasterData,
        // loading: disasterDataLoading,
        // error: disasterDataError,
    } = useQuery<DisasterDataQuery, DisasterDataQueryVariables>(
        DISASTER_DATA,
        {
            variables: {
                countryIso3: iso3,
                startYear: disasterTimeRange[0],
                endYear: disasterTimeRange[1],
                categories: disasterTypes,
                releaseEnvironment: DATA_RELEASE,
                clientId: HELIX_CLIENT_ID,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const displacementsByHazardType = useMemo(() => (
        disasterData?.giddDisasterStatistics.displacementsByHazardType?.map((hazard) => ({
            ...hazard,
            label: getHazardTypeLabel(hazard),
        }))
    ), [
        disasterData?.giddDisasterStatistics.displacementsByHazardType,
    ]);

    if ((statsData?.giddDisasterStatistics?.newDisplacementsRounded ?? 0) <= 0) {
        return null;
    }

    return (
        <Container
            heading={countryMetadata.disasterHeader}
            headingSize="small"
            headerClassName={styles.disasterHeader}
            headingClassName={styles.disasterHeading}
            headingInfo={(
                <TooltipIcon>
                    {countryMetadata.disasterTooltip}
                </TooltipIcon>
            )}
            footerActions={(
                <>
                    <ButtonLikeLink
                        href={suffixHelixRestEndpoint(prepareUrl(
                            '/gidd/disasters/disaster-export/',
                            {
                                iso3__in: iso3,
                                start_year: disasterTimeRange[0],
                                end_year: disasterTimeRange[1],
                                hazard_type__in: disasterTypes,
                            },
                        ))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.disasterButton}
                        icons={(
                            <IoDownloadOutline />
                        )}
                    >
                        Download Disaster Data
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        href={giddDisplacementDataLink}
                        className={styles.disasterButton}
                        icons={(
                            <IoExitOutline />
                        )}
                    >
                        Go to our Data Centre (GIDD)
                    </ButtonLikeLink>
                </>
            )}
            filters={(
                <>
                    <SliderInput
                        className={styles.timeRangeContainer}
                        hideValues
                        min={START_YEAR}
                        max={year}
                        labelDescription={`${disasterTimeRangeActual[0]} - ${disasterTimeRangeActual[1]}`}
                        step={1}
                        minDistance={0}
                        value={disasterTimeRangeActual}
                        onChange={setDisasterTimeRange}
                    />
                    <div />
                    <Header
                        heading="Disaster Type"
                        headingSize="extraSmall"
                        description={(
                            <MultiSelectInput
                                className={styles.selectInput}
                                inputSectionClassName={styles.inputSection}
                                placeholder="Disaster Type"
                                name="disasterType"
                                value={disasterTypes}
                                options={(
                                    statsData?.giddDisasterStatistics.displacementsByHazardType
                                    ?? undefined
                                )}
                                keySelector={disasterTypeKeySelector}
                                labelSelector={disasterTypeLabelSelector}
                                onChange={setDisasterTypes}
                            />
                        )}
                    />
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.disasterInfographic}
                    totalValue={disasterData
                        ?.giddDisasterStatistics.newDisplacementsRounded || 0}
                    description={(
                        <div>
                            <Header
                                headingClassName={styles.heading}
                                heading="Internal Displacements"
                                headingSize="extraSmall"
                                headingInfo={(
                                    <TooltipIcon>
                                        {countryMetadata?.disasterInternalDisplacementTooltip}
                                    </TooltipIcon>
                                )}
                            />
                        </div>
                    )}
                    date={`${disasterTimeRangeActual[0]} - ${disasterTimeRangeActual[1]}`}
                    chart={disasterData?.giddDisasterStatistics.newDisplacementTimeseriesByYear && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <BarChart
                                    data={(
                                        disasterData
                                            .giddDisasterStatistics.newDisplacementTimeseriesByYear
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
                                        domain={disasterTimeRange}
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
                                        fill="var(--color-disaster)"
                                        name="Internal Displacements"
                                        maxBarSize={6}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                />
                <Infographic
                    className={styles.disasterInfographic}
                    totalValue={disasterData
                        ?.giddDisasterStatistics.totalEvents || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Disaster Events Reported"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.disasterEventTooltip}
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`${disasterTimeRangeActual[0]} - ${disasterTimeRangeActual[1]}`}
                    chart={displacementsByHazardType && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Tooltip
                                        formatter={formatNumber}
                                    />
                                    <Legend />
                                    <Pie
                                        data={displacementsByHazardType}
                                        dataKey="newDisplacementsRounded"
                                        nameKey="label"
                                    >
                                        {disasterData
                                            ?.giddDisasterStatistics
                                            ?.displacementsByHazardType
                                            ?.map((data, index) => (
                                                <Cell
                                                    key={data.id}
                                                    fill={categoricalColorScheme[
                                                        index % categoricalColorScheme.length
                                                    ]}
                                                />
                                            ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    )}
                />
            </div>
        </Container>
    );
}
export default DisasterWidget;

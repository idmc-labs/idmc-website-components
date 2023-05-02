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
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
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
    END_YEAR,
    suffixDrupalEndpoint,
    suffixHelixRestEndpoint,
    DATA_RELEASE,
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

const disasterCategoryKeySelector = (d: { label: string }) => d.label;

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
    query DisasterStats($iso3: String!, $startYear: Float, $endYear: Float, $releaseEnvironment: String!) {
        giddDisasterStatistics(countriesIso3: [$iso3], endYear: $endYear, startYear: $startYear, releaseEnvironment: $releaseEnvironment) {
            newDisplacements
            displacementsByHazardType {
                label
                newDisplacements
            }
        }
    }
`;

const DISASTER_DATA = gql`
    query DisasterData($countryIso3: String!, $startYear: Float, $endYear: Float, $categories: [String!], $releaseEnvironment: String!) {
        giddDisasterStatistics(countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear, categories: $categories, releaseEnvironment: $releaseEnvironment) {
            newDisplacements
            totalEvents
            newDisplacementTimeseriesByYear {
                total
                year
            }
            displacementsByHazardType {
                label
                newDisplacements
            }
        }
    }
`;

interface DisasterProps {
    iso3: string;
}

function DisasterWidget(props: DisasterProps) {
    const { iso3 } = props;
    // Disaster section
    const [disasterCategories, setDisasterCategories] = useState<string[]>([]);
    const [disasterTimeRangeActual, setDisasterTimeRange] = useState([START_YEAR, END_YEAR]);
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
                endYear: END_YEAR,
                releaseEnvironment: DATA_RELEASE,
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
                categories: disasterCategories,
                releaseEnvironment: DATA_RELEASE,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    if ((statsData?.giddDisasterStatistics?.newDisplacements ?? 0) <= 0) {
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
                        href={suffixHelixRestEndpoint(`/countries/${iso3}/disaster-export/?start_year=${disasterTimeRange[0]}&end_year=${disasterTimeRange[1]}&hazard_type=${disasterCategories.join(',')}`)}
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
                        max={END_YEAR}
                        labelDescription={`${disasterTimeRangeActual[0]} - ${disasterTimeRangeActual[1]}`}
                        step={1}
                        minDistance={0}
                        value={disasterTimeRangeActual}
                        onChange={setDisasterTimeRange}
                    />
                    <div />
                    <Header
                        heading="Disaster Category"
                        headingSize="extraSmall"
                        description={(
                            <MultiSelectInput
                                className={styles.selectInput}
                                inputSectionClassName={styles.inputSection}
                                placeholder="Disaster Category"
                                name="disasterCategory"
                                value={disasterCategories}
                                options={(
                                    statsData?.giddDisasterStatistics.displacementsByHazardType
                                    ?? undefined
                                )}
                                keySelector={disasterCategoryKeySelector}
                                labelSelector={disasterCategoryKeySelector}
                                onChange={setDisasterCategories}
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
                        ?.giddDisasterStatistics.newDisplacements || 0}
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
                                <LineChart
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
                                    <Line
                                        dataKey="total"
                                        key="total"
                                        stroke="var(--color-disaster)"
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
                    chart={disasterData?.giddDisasterStatistics.displacementsByHazardType && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Tooltip
                                        formatter={formatNumber}
                                    />
                                    <Legend />
                                    <Pie
                                        data={(
                                            disasterData
                                                .giddDisasterStatistics
                                                .displacementsByHazardType
                                        )}
                                        dataKey="total"
                                        nameKey="label"
                                    >
                                        {disasterData
                                            ?.giddDisasterStatistics
                                            ?.displacementsByHazardType
                                            ?.map(({ label }, index) => (
                                                <Cell
                                                    key={label}
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

import React, {
    useMemo,
    useState,
} from 'react';
import {
    MultiSelectInput,
    Pager,
} from '@togglecorp/toggle-ui';
import {
    LngLatBounds,
} from 'mapbox-gl';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoArrowDown,
    IoArrowUp,
    IoDownloadOutline,
    IoExitOutline,
} from 'react-icons/io5';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';

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
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import {
    StatsQuery,
    StatsQueryVariables,
    CountryProfileQuery,
    CountryProfileQueryVariables,
    RelatedMaterialsQuery,
    RelatedMaterialsQueryVariables,
    DisasterDataQuery,
    DisasterDataQueryVariables,
    GiddCategoryStatisticsType,
    ConflictDataQuery,
    ConflictDataQueryVariables,
} from '#generated/types';

import ErrorBoundary from '#components/ErrorBoundary';
import RoundedBar from '#components/RoundedBar';
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';
import Button from '#components/Button';
import ButtonLikeLink from '#components/ButtonLikeLink';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TextOutput from '#components/TextOutput';
import Infographic from '#components/Infographic';
import RelatedMaterialItem from '#components/RelatedMaterialItem';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';
import TooltipIcon from '#components/TooltipIcon';
import DisplacementIcon from '#components/DisplacementIcon';

import {
    formatNumber,
    START_YEAR,
    END_YEAR,
} from '#utils/common';
import useIduMap from '#components/IduMap/useIduMap';

import useDebouncedValue from '../../hooks/useDebouncedValue';

import { countryMetadata } from './data';

import styles from './styles.css';

const contentTypeLabelMapping: {
    [key: string]: string,
} = {
    media_centre: 'Media Centre',
    events: 'Events',
    expert_opinion: 'Expert Opinion',
    publications: 'Publications',
};

// Related material section
// NOTE: we cannot use any page size for related material
// It should be defined on drupal rest view
const relatedMaterialPageSize = 4;

function getContentTypeLabel(val: string | undefined) {
    if (!val) {
        return 'Unknown';
    }
    return contentTypeLabelMapping[val] || 'Unknown';
}

const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';
const HELIX_REST_ENDPOINT = process.env.REACT_APP_HELIX_REST_ENDPOINT as string;
const HELIX_CLIENT_ID = process.env.REACT_APP_HELIX_CLIENT_ID as string || '';

function suffixDrupalEndpoint(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}

function replaceWithDrupalEndpoint(image: null): null;
function replaceWithDrupalEndpoint(image: undefined): undefined;
function replaceWithDrupalEndpoint(image: string): string;
function replaceWithDrupalEndpoint(image: string | null | undefined): string | null | undefined;
function replaceWithDrupalEndpoint(image: string | null | undefined) {
    if (!image || !DRUPAL_ENDPOINT) {
        return image;
    }
    const path = new URL(image).pathname;
    return suffixDrupalEndpoint(path);
}

function suffixHelixRestEndpoint(path: string) {
    return `${HELIX_REST_ENDPOINT}${path}`;
}

const disasterCategoryKeySelector = (d: GiddCategoryStatisticsType) => d.label;

const giddDisplacementDataLink = suffixDrupalEndpoint('/database/displacement-data');
const giddLink = suffixDrupalEndpoint('/database');
const monitoringLink = suffixDrupalEndpoint('/monitoring-tools');

const categoricalColorScheme = [
    'rgb(6, 23, 158)',
    'rgb(8, 56, 201)',
    'rgb(8, 116, 226)',
    'rgb(1, 142, 202)',
    'rgb(45, 183, 226)',
    'rgb(94, 217, 238)',
];

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const COUNTRY_PROFILE = gql`
    query CountryProfile($iso3: String!) {
        # Get this from gidd
        countryProfile(iso3: $iso3) {
            id
            name
            boundingBox
            description
            backgroundImage {
                name
                url
            }
            overviews {
                description
                id
                year
                updatedAt
            }
            contactPersonDescription
            contactPersonImage {
                url
                name
            }
            essentialLinks
            displacementDataDescription
            internalDisplacementDescription
        }
    }
`;

const STATS = gql`
    query Stats($iso3: String!) {
        # Get this from helix
        giddConflictStatistics(countriesIso3: [$iso3]) {
            newDisplacements
            totalIdps
        }
        # Get this from helix
        giddDisasterStatistics(countriesIso3: [$iso3]) {
            newDisplacements

            categories {
                label
                total
            }
        }
    }
`;

const CONFLICT_DATA = gql`
    query ConflictData($countryIso3: String!, $startYear: Float, $endYear: Float) {
        # Get this from helix
        giddConflictStatistics(
            countriesIso3: [$countryIso3],
            endYear: $endYear,
            startYear: $startYear,
        ) {
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

const DISASTER_DATA = gql`
    query DisasterData($countryIso3: String!, $startYear: Float, $endYear: Float, $categories: [String!]) {
        # Get this from helix
        giddDisasterStatistics(
            countriesIso3: [$countryIso3],
            endYear: $endYear,
            startYear: $startYear,
            categories: $categories
        ) {
            newDisplacements
            totalEvents
            categories {
                label
                total
            }
            timeseries {
                total
                year
            }
        }
    }
`;

const RELATED_MATERIALS = gql`
    query RelatedMaterials($countryName: String!, $offset: Int!, $itemsPerPage: Int!) {
        relatedMaterials(countryName: $countryName, offset: $offset, itemsPerPage: $itemsPerPage) @rest(
            type: "RelatedMaterials!",
            method: "GET",
            endpoint: "drupal",
            path: "/previous-information/rest?_format=json&tags=:countryName&offset=:offset&items_per_page=:itemsPerPage",
        ) {
            rows {
                type {
                    target_id
                }
                metatag {
                    value {
                        canonical_url
                        title
                        description
                        og_type
                        og_image_0
                    }
                }
                field_published {
                    value
                }
            }
            pager {
                total_items
                total_pages
                items_per_page
            }
        }
    }
`;

interface Props {
    className?: string;
    iso3: string;
    countryName?: string;
}

function CountryProfile(props: Props) {
    const {
        className,
        iso3: currentCountry,
        countryName,
    } = props;

    /*
    const [countryFilter, setCountryFilter] = useState<string | undefined>(currentCountry);
    const [
        countryOptions,
        setCountryOptions,
    ] = useState<SearchCountryType[] | undefined | null>([{
        name: countryName ?? '',
        iso3: currentCountry,
    }]);
    */

    // Overview section
    const [overviewActiveYear, setOverviewActiveYear] = useState<string>(String(END_YEAR));
    // Conflict section
    const [conflictTimeRangeActual, setConflictTimeRange] = useState([START_YEAR, END_YEAR]);
    const conflictTimeRange = useDebouncedValue(conflictTimeRangeActual);

    // Disaster section
    const [disasterCategories, setDisasterCategories] = useState<string[]>([]);
    const [disasterTimeRangeActual, setDisasterTimeRange] = useState([START_YEAR, END_YEAR]);
    const disasterTimeRange = useDebouncedValue(disasterTimeRangeActual);

    // IDU list section
    const [iduActivePage, setIduActivePage] = useState(1);
    const iduPageSize = 2;

    // IDU map section
    const {
        previousData,
        data: countryProfileData = previousData,
        // FIXME: handle loading and error
        // loading: countryProfileLoading,
        // error: countryProfileError,
    } = useQuery<CountryProfileQuery, CountryProfileQueryVariables>(
        COUNTRY_PROFILE,
        {
            variables: {
                iso3: currentCountry,
            },
            onCompleted: (response) => {
                if (!response.countryProfile) {
                    return;
                }
                const {
                    overviews,
                } = response.countryProfile;
                if (overviews && overviews.length > 0) {
                    setOverviewActiveYear(overviews[0].year.toString());
                }
            },
        },
    );

    const {
        previousData: previousStatsData,
        data: statsData = previousStatsData,
        // FIXME: handle loading and error
        // loading: countryProfileLoading,
        // error: countryProfileError,
    } = useQuery<StatsQuery, StatsQueryVariables>(
        STATS,
        {
            variables: {
                iso3: currentCountry,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const {
        previousData: previousDisasterData,
        data: disasterData = previousDisasterData,
        // FIXME: handle loading and error
        // loading: disasterDataLoading,
        // error: disasterDataError,
    } = useQuery<DisasterDataQuery, DisasterDataQueryVariables>(
        DISASTER_DATA,
        {
            variables: {
                countryIso3: currentCountry,
                startYear: disasterTimeRange[0],
                endYear: disasterTimeRange[1],
                categories: disasterCategories,
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
                countryIso3: currentCountry,
                startYear: conflictTimeRange[0],
                endYear: conflictTimeRange[1],
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const [activeRelatedMaterialPage, setActiveRelatedMaterialPage] = useState(1);

    const relatedMaterialsVariables = useMemo(() => (countryName ? ({
        countryName,
        offset: relatedMaterialPageSize * (activeRelatedMaterialPage - 1),
        itemsPerPage: relatedMaterialPageSize,
    }) : undefined), [
        countryName,
        activeRelatedMaterialPage,
    ]);

    // NOTE: We are storing relatedMaterialsCount, because Drupal's API
    // changes the total count based on current offset
    const [relatedMaterialsCount, setRelatedMaterialsCount] = useState<undefined | number>();
    const {
        previousData: relatedMaterialsPreviousData,
        data: relatedMaterialsResponse = relatedMaterialsPreviousData,
        // FIXME: handle loading and error
        // error,
    } = useQuery<RelatedMaterialsQuery, RelatedMaterialsQueryVariables>(
        RELATED_MATERIALS,
        {
            skip: !countryName,
            variables: relatedMaterialsVariables,
            onCompleted: (response) => {
                if (isNotDefined(relatedMaterialsCount)) {
                    setRelatedMaterialsCount(
                        Number(response?.relatedMaterials?.pager?.total_items) ?? 0,
                    );
                }
            },
        },
    );

    const relatedMaterials = relatedMaterialsResponse?.relatedMaterials?.rows;
    const countryInfo = countryProfileData?.countryProfile;

    const countryOverviewSortedByYear = useMemo(() => {
        if (countryInfo?.overviews) {
            return [...countryInfo.overviews].sort((c1, c2) => c2.year - c1.year);
        }

        return undefined;
    }, [countryInfo]);

    const {
        idus,
        widget: iduWidget,
    } = useIduMap(
        countryInfo?.boundingBox as LngLatBounds | undefined,
        currentCountry,
    );

    /*
    const handleSelectCountry = React.useCallback((selectedIso3: string | undefined) => {
        setCountryFilter(selectedIso3);
        const country = countryOptions?.find((v) => v.iso3 === selectedIso3);
        if (country) {
            const url = new URL(window.location.href);
            url.searchParams.set('iso3', country.iso3);
            url.searchParams.set('countryName', country.name);
            window.location.href = url.href;
        }
    }, [countryOptions]);
    */

    const profileSection = (
        <section className={styles.profile}>
            <Header
                headingSize="extraLarge"
                headingClassName={styles.profileHeading}
                headingInfo={(
                    <>
                        <TooltipIcon>
                            {countryMetadata.countryProfileTooltip}
                        </TooltipIcon>
                        {/*
                        <CountrySelectInput
                            name="country"
                            label="Country"
                            variant="general"
                            onChange={handleSelectCountry}
                            value={countryFilter}
                            options={countryOptions}
                            onOptionsChange={setCountryOptions}
                        />
                        */}
                    </>
                )}
                headingTitle={countryMetadata.countryProfileHeader}
                heading={countryInfo?.name || countryName || currentCountry}
                hideHeadingBorder
            />
            <HTMLOutput
                value={countryInfo?.description}
            />
        </section>
    );

    const overviewSection = (
        countryOverviewSortedByYear && countryOverviewSortedByYear.length > 0
    ) && (
        <section
            id="overview"
            className={styles.overview}
        >
            <Header
                headingSize="large"
                heading={countryMetadata.overviewHeader}
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.overviewTooltip}
                    </TooltipIcon>
                )}
            />
            <div className={styles.overviewContent}>
                <Tabs
                    value={overviewActiveYear}
                    onChange={setOverviewActiveYear}
                    variant="secondary"
                >
                    <TabList className={styles.tabList}>
                        {countryOverviewSortedByYear.map((countryOverview) => (
                            <Tab
                                className={styles.tab}
                                key={countryOverview.year}
                                name={countryOverview.year.toString()}
                            >
                                {countryOverview.year}
                            </Tab>
                        ))}
                    </TabList>
                    {countryInfo?.overviews.map((countryOverview) => (
                        <TabPanel
                            key={countryOverview.year}
                            name={countryOverview.year.toString()}
                        >
                            <EllipsizedContent
                                footer={(
                                    <TextOutput
                                        className={styles.textOutput}
                                        label="Last updated"
                                        value={countryOverview.updatedAt}
                                        valueContainerClassName={styles.value}
                                        valueType="date"
                                    />
                                )}
                            >
                                <HTMLOutput
                                    value={countryOverview.description}
                                />
                            </EllipsizedContent>
                        </TabPanel>
                    ))}
                </Tabs>
            </div>
        </section>
    );

    const disasterSection = (
        (statsData?.giddDisasterStatistics?.newDisplacements ?? 0) > 0
    ) && (
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
                        href={suffixHelixRestEndpoint(`/countries/${currentCountry}/disaster-export/?start_year=${disasterTimeRange[0]}&end_year=${disasterTimeRange[1]}&hazard_type=${disasterCategories.join(',')}&client_id=${HELIX_CLIENT_ID}`)}
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
                                options={statsData?.giddDisasterStatistics.categories}
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
                    chart={disasterData?.giddDisasterStatistics.timeseries && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <LineChart
                                    data={disasterData.giddDisasterStatistics.timeseries}
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
                    chart={disasterData?.giddDisasterStatistics.categories && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Tooltip
                                        formatter={formatNumber}
                                    />
                                    <Legend />
                                    <Pie
                                        data={disasterData.giddDisasterStatistics.categories}
                                        dataKey="total"
                                        nameKey="label"
                                    >
                                        {disasterData
                                            ?.giddDisasterStatistics
                                            ?.categories
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

    const conflictSection = ((
        (statsData?.giddConflictStatistics?.newDisplacements ?? 0)
        + (statsData?.giddConflictStatistics?.totalIdps ?? 0)
    ) > 0) && (
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
                        href={suffixHelixRestEndpoint(`/countries/${currentCountry}/conflict-export/?start_year=${conflictTimeRange[0]}&end_year=${conflictTimeRange[1]}&client_id=${HELIX_CLIENT_ID}`)}
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
                                    {countryMetadata?.conflictInternalDisplacementTooltip }
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`${conflictTimeRangeActual[0]} - ${conflictTimeRangeActual[1]}`}
                    chart={conflictData?.giddConflictStatistics.newDisplacementTimeseries && (
                        <ErrorBoundary>
                            <ResponsiveContainer>
                                <LineChart
                                    data={conflictData.giddConflictStatistics
                                        .newDisplacementTimeseries}
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
                                    {countryMetadata?.conflictIDPTooltip }
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

    const displacementDataSection = (
        conflictSection
        || disasterSection
        || countryInfo?.displacementDataDescription
    ) && (
        <section
            id="displacement-data"
            className={styles.displacementData}
        >
            <Header
                headingSize="large"
                heading={countryMetadata.displacementDataHeader}
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.displacementDataTooltip}
                    </TooltipIcon>
                )}
            />
            <EllipsizedContent>
                <HTMLOutput
                    value={countryInfo?.displacementDataDescription}
                />
            </EllipsizedContent>
            <div className={styles.infographics}>
                {conflictSection}
                {disasterSection}
            </div>
        </section>
    );

    const internalDisplacementUpdatesSection = (
        (idus && idus.length > 0)
        || countryInfo?.internalDisplacementDescription
    ) && (
        <section
            id="internal-displacement"
            className={styles.internalDisplacementUpdates}
        >
            <Header
                headingSize="large"
                heading={countryMetadata.internalDisplacementUpdatesHeader}
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.internalDisplacementUpdatesTooltip}
                    </TooltipIcon>
                )}
            />
            <p>
                {/* eslint-disable-next-line max-len, react/jsx-one-expression-per-line */}
                IDMC&apos;s Internal Displacement Updates (IDU) are preliminary estimates of new displacement events reported in the last 180 days. This provisional data is updated daily with new available data. Curated and validated estimates are published in the <a href={giddLink}>Global Internal Displacement Database (GIDD).</a> To find out more about how we monitor and report on our figures, click <a href={monitoringLink}>here.</a>
            </p>
            <EllipsizedContent>
                <HTMLOutput
                    value={countryInfo?.internalDisplacementDescription}
                />
            </EllipsizedContent>
            {idus && idus.length > 0 && (
                <>
                    <div className={styles.iduContainer}>
                        {idus.slice(0, iduActivePage * iduPageSize)?.map((idu) => (
                            <div
                                key={idu.id}
                                className={styles.idu}
                            >
                                <div className={styles.displacementIcon}>
                                    <DisplacementIcon
                                        className={styles.icon}
                                        displacementType={idu.displacement_type}
                                        disasterType={idu.type}
                                    />
                                    <div>
                                        {idu.displacement_type === 'Disaster'
                                            ? `${idu.displacement_type} - ${idu.type}`
                                            : idu.displacement_type}
                                    </div>
                                </div>
                                <HTMLOutput
                                    value={idu.standard_popup_text}
                                />
                            </div>
                        ))}
                        <div className={styles.iduPager}>
                            {idus.length > (iduActivePage * iduPageSize) && (
                                <Button
                                    name={undefined}
                                    onClick={() => {
                                        setIduActivePage((val) => val + 1);
                                    }}
                                    actions={<IoArrowDown />}
                                    variant="transparent"
                                >
                                    Show Older Displacements
                                </Button>
                            )}
                            {iduActivePage > 1 && (
                                <Button
                                    name={undefined}
                                    onClick={() => {
                                        setIduActivePage(1);
                                    }}
                                    actions={<IoArrowUp />}
                                    variant="transparent"
                                >
                                    Show Less
                                </Button>
                            )}
                        </div>
                    </div>
                    <div>
                        Hover over and click on the coloured bubbles to see near real-time
                        snapshots of situations of internal displacement.
                    </div>
                    {iduWidget}
                </>
            )}
        </section>
    );

    const relatedMaterialsSection = (
        relatedMaterials && relatedMaterials.length > 0
    ) && (
        <section
            id="related-materials"
            className={styles.relatedMaterial}
        >
            <Header
                headingSize="large"
                heading={countryMetadata.relatedMaterialHeader}
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.relatedMaterialTooltip}
                    </TooltipIcon>
                )}
            />
            <div className={styles.materialList}>
                {relatedMaterials.map((gp) => (
                    <RelatedMaterialItem
                        key={gp.metatag.value.canonical_url}
                        className={styles.material}
                        coverImageUrl={replaceWithDrupalEndpoint(gp.metatag.value.og_image_0)}
                        url={gp.metatag.value.canonical_url}
                        heading={gp.metatag.value.title}
                        description={gp.metatag.value.description}
                        // FIXME: pass date
                        // FIXME: pass doc type
                        type={getContentTypeLabel(gp?.type?.[0]?.target_id)}
                        date={gp?.field_published?.[0]?.value}
                    />
                ))}
            </div>
            <div className={styles.materialPager}>
                <Pager
                    activePage={activeRelatedMaterialPage}
                    onActivePageChange={setActiveRelatedMaterialPage}
                    maxItemsPerPage={relatedMaterialPageSize}
                    totalCapacity={4}
                    itemsCount={relatedMaterialsCount ?? 0}
                    itemsPerPageControlHidden
                />
            </div>
        </section>
    );

    const essentialLinksSection = (
        countryInfo?.essentialLinks
    ) && (
        <div
            className={styles.essentialReading}
        >
            <Header
                heading={countryMetadata.essentialReadingHeader}
                headingSize="large"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.essentialReadingTooltip}
                    </TooltipIcon>
                )}
            />
            <HTMLOutput
                value={countryInfo.essentialLinks}
            />
        </div>
    );

    const contactSection = (
        countryInfo?.contactPersonDescription
        || countryInfo?.contactPersonImage
    ) && (
        <div
            className={styles.contact}
            id="contact"
        >
            <Header
                heading={countryMetadata.contactHeader}
                headingSize="large"
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.contactTooltip}
                    </TooltipIcon>
                )}
            />
            <div>
                Do you have more questions about this country? Contact our Monitoring Expert
            </div>
            <div className={styles.contactItem}>
                {countryInfo.contactPersonImage && (
                    <img
                        className={styles.preview}
                        src={countryInfo.contactPersonImage.url}
                        alt={countryInfo.contactPersonImage.name}
                    />
                )}
                <HTMLOutput
                    className={styles.contactDetails}
                    value={countryInfo.contactPersonDescription}
                />
            </div>
        </div>
    );

    const navbar = (
        <nav className={styles.navbar}>
            {!!overviewSection && (
                <a
                    href="#overview"
                    className={styles.navLink}
                >
                    {countryMetadata.overviewHeader}
                </a>
            )}
            {!!displacementDataSection && (
                <a
                    href="#displacement-data"
                    className={styles.navLink}
                >
                    {countryMetadata.displacementDataHeader}
                </a>
            )}
            {!!internalDisplacementUpdatesSection && (
                <a
                    href="#internal-displacement"
                    className={styles.navLink}
                >
                    {countryMetadata.internalDisplacementUpdatesHeader}
                </a>
            )}
            {!!relatedMaterialsSection && (
                <a
                    href="#related-materials"
                    className={styles.navLink}
                >
                    {countryMetadata.relatedMaterialHeader}
                </a>
            )}
            {!!contactSection && (
                <a
                    href="#contact"
                    className={styles.navLink}
                >
                    {countryMetadata.contactHeader}
                </a>
            )}
        </nav>
    );
    const headerStyles = useMemo(() => ({
        backgroundImage: `url(${countryInfo?.backgroundImage?.url})`,
    }), [countryInfo]);

    return (
        <div className={_cs(styles.countryProfile, className)}>
            <div
                className={styles.headerContainer}
                style={headerStyles}
            >
                <div className={styles.content}>
                    {profileSection}
                    {navbar}
                </div>
            </div>
            <div className={styles.bodyContainer}>
                <div className={styles.content}>
                    {overviewSection}
                    {displacementDataSection}
                    {internalDisplacementUpdatesSection}
                    {relatedMaterialsSection}
                    <section className={styles.misc}>
                        {essentialLinksSection}
                        {contactSection}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default CountryProfile;

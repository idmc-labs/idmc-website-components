import React, {
    useMemo,
    useCallback,
    useState,
} from 'react';
import {
    MultiSelectInput,
} from '@the-deep/deep-ui';
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
    LngLatBounds,
} from 'mapbox-gl';
import {
    _cs,
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import { saveAs } from 'file-saver';
import stringify from 'csv-stringify/lib/browser/sync';
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
    CountryProfileQuery,
    CountryProfileQueryVariables,
    IduDataQuery,
    IduDataQueryVariables,
    RelatedMaterialsQuery,
    RelatedMaterialsQueryVariables,
    DisasterDataQuery,
    DisasterDataQueryVariables,
    CategoryStatisticsType,
    ConflictDataQuery,
    ConflictDataQueryVariables,
} from '#generated/types';

// import CountrySelectInput, { SearchCountryType } from '#components/CountrySelectInput';
import RoundedBar from '#components/RoundedBar';
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';
import LegendElement from '#components/LegendElement';
import Button from '#components/Button';
import ButtonLikeLink from '#components/ButtonLikeLink';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TextOutput from '#components/TextOutput';
import Infographic from '#components/Infographic';
import GoodPracticeItem from '#components/GoodPracticeItem';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';
import TooltipIcon from '#components/TooltipIcon';
import DisplacementIcon from '#components/DisplacementIcon';

import { formatNumber } from '#utils/common';

import useDebouncedValue from '../../hooks/useDebouncedValue';
import useInputState from '../../hooks/useInputState';

import IduMap from './IduMap';
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

function getContentTypeLabel(val: string | undefined) {
    if (!val) {
        return 'Unknown';
    }
    return contentTypeLabelMapping[val] || 'Unknown';
}

const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';
const REST_ENDPOINT = process.env.REACT_APP_REST_ENDPOINT as string;

function suffixDrupalEndpoing(path: string) {
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
    return suffixDrupalEndpoing(path);
}

function suffixGiddRestEndpoint(path: string) {
    return `${REST_ENDPOINT}${path}`;
}

// NOTE: this is repeated
type DisplacementType = 'Conflict' | 'Disaster' | 'Other';
type DisplacementNumber = 'less-than-100' | 'less-than-1000' | 'more-than-1000';

const disasterCategoryKeySelector = (d: CategoryStatisticsType) => d.label;

// constants
const START_YEAR = 2008;
const END_YEAR = 2021;
const END_YEAR_FOR_IDU = (new Date()).getFullYear();

const giddLink = suffixDrupalEndpoing('/database/displacement-data');

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
        country(iso3: $iso3) {
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
        conflictStatistics(filters: { countriesIso3: [$iso3] }) {
            newDisplacements
            totalIdps
        }
        disasterStatistics(filters: { countriesIso3: [$iso3] }) {
            newDisplacements

            categories {
                label
                total
            }
        }
    }
`;

const CONFLICT_DATA = gql`
    query ConflictData($countryIso3: String!, $startYear: Int, $endYear: Int) {
        conflictStatistics(filters: { countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear }) {
            newDisplacements
            totalIdps
            timeseries {
                totalIdps
                totalNewDisplacement
                year
            }
        }
    }
`;

const DISASTER_DATA = gql`
    query DisasterData($countryIso3: String!, $startYear: Int, $endYear: Int, $categories: [String!]) {
        disasterStatistics(filters: { countriesIso3: [$countryIso3], endYear: $endYear, startYear: $startYear, categories: $categories}) {
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

const IDU_DATA = gql`
    query IduData($country: String!) {
        idu(country: $country) @rest(
            type: "[IduData]",
            method: "GET",
            endpoint: "helix",
            path: "/data/idus_view_flat_cached?iso3=eq.:country&order=displacement_start_date.desc,displacement_end_date.desc"
        ) {
            id
            country
            iso3
            centroid
            latitude
            longitude
            displacement_type
            qualifier
            figure
            displacment_date
            displacement_start_date
            displacement_end_date
            year
            event_name
            event_start_date
            event_end_date
            category
            subcategory
            type
            subtype
            standard_popup_text
            standard_info_text
        }
    }
`;

const RELATED_MATERIALS = gql`
    query RelatedMaterials($countryName: String!, $offset: Int!, $itemsPerPage: Int!) {
        relatedMaterials(countryName: $countryName, offset: $offset, itemsPerPage: $itemsPerPage) @rest(
            type: "RelatedMaterials!",
            method: "GET",
            endpoint: "drupal",
            path: "/previous-information/rest?_format=json&tags=:countryName&offset=:offset&items_per_page=:itemsPerPage"
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

    // Related material section
    // NOTE: we cannot use any page size for related material
    // It should be defined on drupal rest view
    const relatedMaterialPageSize = 4;

    // IDU list section
    const [iduActivePage, setIduActivePage] = useState(1);
    const iduPageSize = 2;

    // IDU map section
    /*
    const [mapTimeRangeBounds, setMapTimeRangeBounds] = useState<[number, number]>(
        [START_YEAR, END_YEAR],
    );
    */
    const [mapTimeRangeActual, setMapTimeRange] = useState<[number, number]>(
        [START_YEAR, END_YEAR_FOR_IDU],
    );
    const mapTimeRange = useDebouncedValue(mapTimeRangeActual);
    const [
        mapTypeOfDisplacements,
        setMapTypeOfDisplacements,
    ] = useInputState<DisplacementType[]>(['Conflict', 'Disaster']);
    const [
        mapNoOfDisplacements,
        setMapNoOfDisplacements,
    ] = useInputState<DisplacementNumber[]>(['less-than-100', 'less-than-1000', 'more-than-1000']);

    const handleTypeOfDisplacementsChange = useCallback((value: DisplacementType) => {
        setMapTypeOfDisplacements((oldValue: DisplacementType[]) => {
            const newValue = [...oldValue];
            const oldIndex = oldValue.findIndex((d) => d === value);
            if (oldIndex !== -1) {
                newValue.splice(oldIndex, 1);
            } else {
                newValue.push(value);
            }

            return newValue;
        });
    }, [setMapTypeOfDisplacements]);

    const handleNoOfDisplacementsChange = useCallback((value: DisplacementNumber) => {
        setMapNoOfDisplacements((oldValue: DisplacementNumber[]) => {
            const newValue = [...oldValue];
            const oldIndex = oldValue.findIndex((d) => d === value);
            if (oldIndex !== -1) {
                newValue.splice(oldIndex, 1);
            } else {
                newValue.push(value);
            }

            return newValue;
        });
    }, [setMapNoOfDisplacements]);

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
                if (!response.country) {
                    return;
                }
                const {
                    overviews,
                } = response.country;
                if (overviews && overviews.length > 0) {
                    setOverviewActiveYear(overviews[0].year.toString());
                }
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
        },
    );

    const {
        previousData: previousIduData,
        data: iduData = previousIduData,
        // FIXME: handle loading and error
        // loading: iduDataLoading,
        // error: iduDataError,
    } = useQuery<IduDataQuery, IduDataQueryVariables>(
        IDU_DATA,
        {
            variables: {
                country: currentCountry,
            },
            /*
            onCompleted: (response) => {
                if (!response.idu || response.idu.length <= 0) {
                    return;
                }
                const max = Math.max(...response.idu.map((item) => item.year).filter(isDefined));
                let min = Math.min(...response.idu.map((item) => item.year).filter(isDefined));
                if (min === max) {
                    min -= 1;
                }
                setMapTimeRangeBounds([min, max]);
                setMapTimeRange([min, max]);
            },
            */
        },
    );

    const {
        data,
        fetchMore,
        refetch,
        loading: loadingRelatedMaterials,
        // FIXME: handle loading and error
        // error,
    } = useQuery<RelatedMaterialsQuery, RelatedMaterialsQueryVariables>(
        RELATED_MATERIALS,
        {
            skip: !countryName,
            variables: countryName ? {
                countryName,
                offset: 0,
                itemsPerPage: relatedMaterialPageSize,
            } : undefined,
        },
    );

    const relatedMaterials = data?.relatedMaterials?.rows;
    const relatedMaterialsOffset = relatedMaterials?.length ?? 0;

    const remainingRelatedMaterialsCount = Math.max(
        0,
        Number(data?.relatedMaterials?.pager?.total_items || '0') - relatedMaterialPageSize,
    );

    const idus = iduData?.idu;
    const countryInfo = countryProfileData?.country;

    const countryOverviewSortedByYear = useMemo(() => {
        if (countryInfo?.overviews) {
            return [...countryInfo.overviews].sort((c1, c2) => c2.year - c1.year);
        }

        return undefined;
    }, [countryInfo]);

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

    const handleExportIduClick = React.useCallback(() => {
        // FIXME: we have duplicate logic for filtering for now
        const filteredIdus = idus?.map((idu) => {
            if (
                isNotDefined(idu.longitude)
                || isNotDefined(idu.latitude)
                || isNotDefined(idu.figure)
                || isNotDefined(idu.displacement_type)
                // NOTE: filtering out displacement_type Other
                || idu.displacement_type === 'Other'
            ) {
                return undefined;
            }

            if (!mapTypeOfDisplacements.includes(idu.displacement_type)) {
                return undefined;
            }

            let key: DisplacementNumber;
            if (idu.figure < 100) {
                key = 'less-than-100';
            } else if (idu.figure < 1000) {
                key = 'less-than-1000';
            } else {
                key = 'more-than-1000';
            }
            if (!mapNoOfDisplacements.includes(key)) {
                return undefined;
            }

            const [min, max] = mapTimeRange;
            if (!idu.year || idu.year < min || idu.year > max) {
                return undefined;
            }
            return idu;
        }).filter(isDefined);

        if (filteredIdus && filteredIdus.length > 0) {
            // FIXME: we may need to manually set headers (first data may not
            // always have all the keys)
            const headers = Object.keys(filteredIdus[0]);

            const dataString = stringify(filteredIdus, {
                columns: headers,
            });
            const fullCsvString = `${headers}\n${dataString}`;
            const blob = new Blob(
                [fullCsvString],
                { type: 'text/csv;charset=utf-8' },
            );
            saveAs(blob, 'idu_export.csv');
        }
    }, [idus, mapNoOfDisplacements, mapTypeOfDisplacements, mapTimeRange]);

    const handleShowMoreButtonClick = useCallback(() => {
        fetchMore({
            variables: {
                countryName,
                offset: relatedMaterialsOffset,
                itemsPerPage: relatedMaterialPageSize,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!previousResult.relatedMaterials) {
                    return previousResult;
                }
                const newRows = fetchMoreResult?.relatedMaterials?.rows;
                const newPager = fetchMoreResult?.relatedMaterials?.pager;
                const oldRows = previousResult.relatedMaterials?.rows;

                if (!newRows || !newPager) {
                    return previousResult;
                }
                return ({
                    ...previousResult,
                    relatedMaterials: {
                        ...previousResult.relatedMaterials,
                        rows: [
                            ...(oldRows ?? []),
                            ...(newRows ?? []),
                        ],
                        pager: newPager,
                    },
                });
            },
        });
    }, [
        countryName,
        relatedMaterialsOffset,
        fetchMore,
    ]);

    const profileSection = (
        <section className={styles.profile}>
            <Header
                headingSize="extraLarge"
                headingClassName={styles.profileHeading}
                headingInfo={(
                    <>
                        <TooltipIcon>
                            {countryMetadata.countryProfileTooltip }
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
            <EllipsizedContent darkMode>
                <HTMLOutput
                    value={countryInfo?.description}
                />
            </EllipsizedContent>
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
        (countryProfileData?.disasterStatistics?.newDisplacements ?? 0) > 0
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
                        href={suffixGiddRestEndpoint(`/countries/${currentCountry}/disaster-export/?start_year=${disasterTimeRange[0]}&end_year=${disasterTimeRange[1]}&hazard_type=${disasterCategories.join(',')}`)}
                        target="_blank"
                        className={styles.disasterButton}
                        rel="noopener noreferrer"
                        icons={(
                            <IoDownloadOutline />
                        )}
                    >
                        Download disaster data
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        href={giddLink}
                        className={styles.disasterButton}
                        target="_blank"
                        rel="noopener noreferrer"
                        icons={(
                            <IoExitOutline />
                        )}
                    >
                        View GIDD dashboard
                    </ButtonLikeLink>
                </>
            )}
            filters={(
                <>
                    <Header
                        heading="Disaster Category"
                        headingSize="extraSmall"
                        description={(
                            <MultiSelectInput
                                className={styles.selectInput}
                                inputSectionClassName={styles.inputSection}
                                variant="general"
                                placeholder="Disaster Category"
                                name="disasterCategory"
                                value={disasterCategories}
                                options={countryProfileData?.disasterStatistics.categories}
                                keySelector={disasterCategoryKeySelector}
                                labelSelector={disasterCategoryKeySelector}
                                onChange={setDisasterCategories}
                            />
                        )}
                    />
                    <SliderInput
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
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.disasterInfographic}
                    totalValue={disasterData
                        ?.disasterStatistics.newDisplacements || 0}
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
                    chart={(
                        <ResponsiveContainer>
                            <LineChart
                                data={disasterData?.disasterStatistics.timeseries}
                                margin={chartMargins}
                            >
                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                />
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
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
                                    name="Disaster internal displacements"
                                    strokeWidth={2}
                                    connectNulls
                                    dot
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <Infographic
                    className={styles.disasterInfographic}
                    totalValue={disasterData
                        ?.disasterStatistics.totalEvents || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Disaster events reported"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.disasterEventTooltip}
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`${disasterTimeRangeActual[0]} - ${disasterTimeRangeActual[1]}`}
                    chart={(
                        <ResponsiveContainer>
                            <PieChart>
                                <Tooltip
                                    formatter={formatNumber}
                                />
                                <Legend />
                                <Pie
                                    data={disasterData
                                        ?.disasterStatistics.categories}
                                    dataKey="total"
                                    nameKey="label"
                                >
                                    {disasterData
                                        ?.disasterStatistics
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
                    )}
                />
            </div>
        </Container>
    );

    const conflictSection = ((
        (countryProfileData?.conflictStatistics?.newDisplacements ?? 0)
        + (countryProfileData?.conflictStatistics?.totalIdps ?? 0)
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
                        href={suffixGiddRestEndpoint(`/countries/${currentCountry}/conflict-export/?start_year=${conflictTimeRange[0]}&end_year=${conflictTimeRange[1]}`)}
                        target="_blank"
                        className={styles.conflictButton}
                        rel="noopener noreferrer"
                        icons={(
                            <IoDownloadOutline />
                        )}
                    >
                        Download conflict data
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        href={giddLink}
                        className={styles.conflictButton}
                        target="_blank"
                        rel="noopener noreferrer"
                        icons={(
                            <IoExitOutline />
                        )}
                    >
                        View GIDD dashboard
                    </ButtonLikeLink>
                </>
            )}
        >
            <div className={styles.infographicList}>
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.conflictStatistics.newDisplacements || 0}
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
                    chart={(
                        <ResponsiveContainer>
                            <LineChart
                                data={conflictData?.conflictStatistics.timeseries}
                                margin={chartMargins}
                            >
                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                />
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
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
                                    dataKey="totalNewDisplacement"
                                    key="totalNewDisplacement"
                                    stroke="var(--color-conflict)"
                                    name="Conflict internal displacements"
                                    strokeWidth={2}
                                    connectNulls
                                    dot
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <Infographic
                    className={styles.conflictInfographic}
                    totalValue={conflictData?.conflictStatistics.totalIdps || 0}
                    description={(
                        <Header
                            headingClassName={styles.heading}
                            heading="Total number of IDPs"
                            headingSize="extraSmall"
                            headingInfo={(
                                <TooltipIcon>
                                    {countryMetadata?.conflictIDPTooltip }
                                </TooltipIcon>
                            )}
                        />
                    )}
                    date={`As of end of ${conflictTimeRangeActual[1]}`}
                    chart={(
                        <ResponsiveContainer>
                            <BarChart
                                data={conflictData?.conflictStatistics.timeseries}
                                margin={chartMargins}
                            >
                                <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                />
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
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
                                    dataKey="totalIdps"
                                    name="Conflict total number of IDPs"
                                    fill="var(--color-conflict)"
                                    shape={<RoundedBar />}
                                    maxBarSize={6}
                                />
                            </BarChart>
                        </ResponsiveContainer>
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
                                    className={styles.iduPagerButton}
                                    name={undefined}
                                    onClick={() => {
                                        setIduActivePage((val) => val + 1);
                                    }}
                                    actions={<IoArrowDown />}
                                    variant="secondary"
                                >
                                    Show older displacements
                                </Button>
                            )}
                            {iduActivePage > 1 && (
                                <Button
                                    className={styles.iduPagerButton}
                                    name={undefined}
                                    onClick={() => {
                                        setIduActivePage(1);
                                    }}
                                    actions={<IoArrowUp />}
                                    variant="secondary"
                                >
                                    Show less
                                </Button>
                            )}
                        </div>
                    </div>
                    <div>
                        Hover over and click on the coloured bubbles to see near real-time
                        snapshots of situations of internal displacement across the globe.
                    </div>
                    <Container
                        filters={(
                            <>
                                <div className={styles.legend}>
                                    <Header
                                        headingSize="extraSmall"
                                        heading="Type of Displacement"
                                    />
                                    <div className={styles.legendElementList}>
                                        <LegendElement
                                            name="Conflict"
                                            onClick={handleTypeOfDisplacementsChange}
                                            isActive={mapTypeOfDisplacements.includes('Conflict')}
                                            color="var(--color-conflict)"
                                            label="Conflict"
                                        />
                                        <LegendElement
                                            name="Disaster"
                                            onClick={handleTypeOfDisplacementsChange}
                                            isActive={mapTypeOfDisplacements.includes('Disaster')}
                                            color="var(--color-disaster)"
                                            label="Disaster"
                                        />
                                    </div>
                                </div>
                                <div className={styles.legend}>
                                    <Header
                                        headingSize="extraSmall"
                                        heading="No. of Displacement"
                                    />
                                    <div className={styles.legendElementList}>
                                        <LegendElement
                                            name="less-than-100"
                                            onClick={handleNoOfDisplacementsChange}
                                            isActive={mapNoOfDisplacements.includes('less-than-100')}
                                            color="grey"
                                            size={10}
                                            label="< 100"
                                        />
                                        <LegendElement
                                            name="less-than-1000"
                                            onClick={handleNoOfDisplacementsChange}
                                            isActive={mapNoOfDisplacements.includes('less-than-1000')}
                                            color="grey"
                                            size={18}
                                            label="100 - 1000"
                                        />
                                        <LegendElement
                                            name="more-than-1000"
                                            onClick={handleNoOfDisplacementsChange}
                                            isActive={mapNoOfDisplacements.includes('more-than-1000')}
                                            color="grey"
                                            size={26}
                                            label="> 1000"
                                        />
                                    </div>
                                </div>
                                <div className={styles.timeRangeContainer}>
                                    <SliderInput
                                        hideValues
                                        className={styles.timeRangeInput}
                                        // min={mapTimeRangeBounds[0]}
                                        // max={mapTimeRangeBounds[1]}
                                        min={START_YEAR}
                                        max={END_YEAR_FOR_IDU}
                                        labelDescription={`${mapTimeRange[0]} - ${mapTimeRange[1]}`}
                                        step={1}
                                        minDistance={0}
                                        value={mapTimeRange}
                                        onChange={setMapTimeRange}
                                    />
                                </div>
                            </>
                        )}
                        footerActions={(
                            <>
                                <Button
                                    name={undefined}
                                    // variant="secondary"
                                    onClick={handleExportIduClick}
                                    icons={(
                                        <IoDownloadOutline />
                                    )}
                                >
                                    Download displacement data
                                </Button>
                                <ButtonLikeLink
                                    href={giddLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icons={(
                                        <IoExitOutline />
                                    )}
                                >
                                    View GIDD dashboard
                                </ButtonLikeLink>
                            </>
                        )}
                    >
                        <IduMap
                            idus={idus}
                            boundingBox={countryInfo?.boundingBox as LngLatBounds | undefined}
                            mapTypeOfDisplacements={mapTypeOfDisplacements}
                            mapNoOfDisplacements={mapNoOfDisplacements}
                            mapTimeRange={mapTimeRange}
                        />
                    </Container>
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
                    <GoodPracticeItem
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
                {remainingRelatedMaterialsCount > 0 && (
                    <Button
                        // FIXME: need to hide this if there is no more data
                        className={styles.materialPagerButton}
                        name={undefined}
                        onClick={handleShowMoreButtonClick}
                        disabled={loadingRelatedMaterials}
                        actions={<IoArrowDown />}
                        variant="secondary"
                    >
                        Show more
                    </Button>
                )}
                {(data?.relatedMaterials?.rows?.length ?? 0) > relatedMaterialPageSize && (
                    <Button
                        // FIXME: need to hide this if there is no more data
                        className={styles.materialPagerButton}
                        name={undefined}
                        onClick={() => refetch()}
                        disabled={loadingRelatedMaterials}
                        actions={<IoArrowUp />}
                        variant="secondary"
                    >
                        Show less
                    </Button>
                )}
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
                        {countryMetadata.essentialReadingTooltip }
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

    return (
        <div className={_cs(styles.countryProfile, className)}>
            <img
                className={styles.coverImage}
                src={countryInfo?.backgroundImage?.url}
                alt={countryInfo?.backgroundImage?.name}
            />
            <div className={styles.headerContainer}>
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

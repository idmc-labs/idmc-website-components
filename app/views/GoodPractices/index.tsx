import React, { useCallback, useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    FaqsQueryVariables, FaqsQuery,
    GoodPracticesQuery,
    GoodPracticesQueryVariables,
    GoodPracticeListingStaticPageQuery,
    GoodPracticeListingStaticPageQueryVariables,
    GoodPracticeFilterChoicesQuery,
    GoodPracticeFilterChoicesQueryVariables,
    GoodPracticeMapQuery,
    GoodPracticeMapQueryVariables,
} from '#generated/types';
import {
    TextInput,
    MultiSelectInput,
    Modal,
    RadioInput,
} from '@togglecorp/toggle-ui';
import Map, {
    MapContainer,
    MapSource,
    MapLayer,
    MapTooltip,
} from '@togglecorp/re-map';

import mapboxgl, {
    LngLatLike,
    PopupOptions,
    LngLat,
} from 'mapbox-gl';
import {
    _cs,
    listToMap,
    unique,
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    IoSearch,
    IoClose,
    IoArrowDown,
    IoArrowUp,
    IoFilter,
    IoGridOutline,
    IoListOutline,
} from 'react-icons/io5';

import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';
import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import ListView from '#components/ListView';
import DropdownMenu from '#components/DropdownMenu';
import DropdownMenuItem from '#components/DropdownMenuItem';
import EllipsizedContent from '#components/EllipsizedContent';
import CollapsibleContent from '#components/CollapsibleContent';
import GoodPracticeItem from '#components/GoodPracticeItem';
import SliderInput from '#components/SliderInput';
import DismissableListOutput from '#components/DismissableListOutput';
import useBooleanState from '#hooks/useBooleanState';
import useInputState from '#hooks/useInputState';

import backgroundImage from '../../resources/img/backgroundImage.png';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useDocumentSize from '#hooks/useDocumentSize';

import styles from './styles.css';

const GOOD_PRACTICE_PAGE_SIZE = 6;

const FAQS = gql`
    query Faqs {
            faqs {
            answer
            id
            question
        }
    }
`;

const GOOD_PRACTICES = gql`
query GoodPractices(
    $search : String!,
    $types: [TypeEnum!],
    $driversOfDisplacements : [ID!],
    $focusArea:[ID!] ,
    $stages: [StageTypeEnum!]!,
    $regions: [GoodPracticeRegion!],
    $countries: [ID!],
    $startYear: Int!,
    $endYear: Int!,
    $limit: Int!,
    $offset: Int!,
    $ordering: GoodPracticeOrder!
) {
    goodPractices(
        ordering: $ordering,
        filters: {
            search: $search,
            types: $types,
            driversOfDisplacements: $driversOfDisplacements,
            focusArea: $focusArea,
            stages: $stages,
            regions: $regions,
            countries: $countries,
            startYear: $startYear,
            endYear: $endYear,
        },
        pagination: {limit: $limit, offset: $offset},
    ) {
        totalCount
        results {
            id
            title
            description
            publishedDate
            startYear
            endYear
            image {
                name
                url
            }
            countries {
                name
                goodPracticeRegion
                id
                goodPracticeRegionLabel
            }
            tags {
                id
                name
            }
        }
    }
}
`;

const STATIC_PAGES = gql`
query GoodPracticeListingStaticPage {
    staticPages {
        description
        type
        id
    }
}
`;

const GOOD_PRACTICE_MAP = gql`
query GoodPracticeMap {
    countries {
        id
        name
        centerPoint
        goodPracticesCount
    }
}
`;

const GOOD_PRACTICE_FILTER_CHOICES = gql`
query GoodPracticeFilterChoices {
    goodPracticeFilterChoices {
        startYear
        endYear
        countries {
            id
            name
        }
        driversOfDisplacement {
            id
            name
        }
        focusArea {
            id
            name
        }
        regions {
            label
            name
        }
        stage {
            label
            name
        }
        type {
            label
            name
        }
    }
}
`;

type GoodPracticeItemType = NonNullable<NonNullable<GoodPracticesQuery['goodPractices']>['results']>[number];

type GoodPracticeGeoJSON = GeoJSON.FeatureCollection<
    GeoJSON.Point,
    { value: number, name: string }
>;

interface PopupProperties {
    name: string,
    value: number,
}

const popupOptions: PopupOptions = {
    closeOnClick: true,
    closeButton: false,
    offset: 12,
    maxWidth: '480px',
};

const keySelector = (d: { key: string }) => d.key;
const labelSelector = (d: { label: string }) => d.label;

const lightStyle = 'mapbox://styles/mapbox/light-v10';

const orangePointHaloCirclePaint: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-color': 'rgb(1, 142, 202)',
    'circle-radius': 12,
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

function idSelector(d: { id: string }) {
    return d.id;
}

function nameSelector(d: { name: string }) {
    return d.name;
}

function goodPracticekeySelector(d: GoodPracticeItemType | undefined, i: number) {
    return d?.id ?? String(i);
}

type OrderingOptionType = 'recent' | 'oldest' | 'mostPopular' | 'leastPopular';
const orderingOptions: {
    [key in OrderingOptionType]: string;
} = {
    recent: 'Year of Publication (Latest First)',
    oldest: 'Year of Publication (Oldest First)',
    mostPopular: 'Most Popular First',
    leastPopular: 'Least Popular First',
};

type OrderingType = {
    [key in 'publishedDate' | 'pageViewedCount']?: 'ASC' | 'DESC'
}
function getOrderingFromOption(option: OrderingOptionType): OrderingType {
    if (option === 'recent') {
        return { publishedDate: 'DESC' };
    }
    if (option === 'oldest') {
        return { publishedDate: 'ASC' };
    }
    if (option === 'mostPopular') {
        return { pageViewedCount: 'DESC' };
    }
    if (option === 'leastPopular') {
        return { pageViewedCount: 'ASC' };
    }

    return { publishedDate: 'DESC' };
}

type GoodPracticeFilter = NonNullable<GoodPracticeFilterChoicesQuery>['goodPracticeFilterChoices'];
type GoodPracticeTypeType = NonNullable<GoodPracticeFilter['type']>[number]['name'];
type GoodPracticeAreaType = NonNullable<GoodPracticeFilter['focusArea']>[number]['id'];
type GoodPracticeDriveType = NonNullable<GoodPracticeFilter['driversOfDisplacement']>[number]['id'];
type GoodPracticeStageType = NonNullable<GoodPracticeFilter['stage']>[number]['name'];
type GoodPracticeRegionType = NonNullable<GoodPracticeFilter['regions']>[number]['name'];
type GoodPracticeCountryType = NonNullable<GoodPracticeFilter['countries']>[number]['name'];

interface Props {
    className?: string;
    showTooltip?: boolean;
}

function GoodPractices(props: Props) {
    const {
        className,
        showTooltip = true,
    } = props;

    const practicesListRef = React.useRef<HTMLDivElement>(null);
    const [
        orderingOptionValue,
        setOrderingOptionValue,
    ] = React.useState<OrderingOptionType>('recent');

    const ordering = React.useMemo(() => (
        getOrderingFromOption(orderingOptionValue)
    ), [orderingOptionValue]);

    const [expandedFaq, setExpandedFaq] = useState<string>();
    const [activeTab, setActiveTab] = useState<'grid' | 'list' | undefined>('grid');
    const [searchText, setSearchText] = useState<string>();
    const windowSize = useDocumentSize();
    const isSmallDisplay = windowSize.width < 600;

    const [
        showFiltersModal,
        setShowFilterModalTrue,
        setShowFilterModalFalse,
    ] = useBooleanState(false);

    const [yearRange, setYearRange] = useInputState<[number, number]>([0, 0]);
    const [goodPracticeType, setGoodPracticeType] = useInputState<GoodPracticeTypeType[]>([]);
    const [goodPracticeArea, setGoodPracticeArea] = useInputState<GoodPracticeAreaType[]>([]);
    const [goodPracticeDrive, setGoodPracticeDrive] = useInputState<GoodPracticeDriveType[]>([]);
    const [goodpracticeStage, setGoodPracticeStage] = useInputState<GoodPracticeStageType[]>([]);
    const [
        goodPracticeRegion,
        setGoodPracticeRegion,
    ] = useInputState<GoodPracticeRegionType[]>([]);
    const [
        goodPracticeCountry,
        setGoodPracticeCountry,
    ] = useInputState<GoodPracticeCountryType[]>([]);

    const {
        data: goodPracticeFilterResponse,
    } = useQuery<
        GoodPracticeFilterChoicesQuery,
        GoodPracticeFilterChoicesQueryVariables
    >(
        GOOD_PRACTICE_FILTER_CHOICES,
        {
            onCompleted: (response) => {
                const {
                    goodPracticeFilterChoices: {
                        startYear,
                        endYear,
                    },
                } = response;
                setYearRange([startYear, endYear]);
            },
        },
    );

    const handleClearFilterClick = React.useCallback(() => {
        setSearchText(undefined);
        if (goodPracticeFilterResponse) {
            const {
                goodPracticeFilterChoices: {
                    startYear,
                    endYear,
                },
            } = goodPracticeFilterResponse;
            setYearRange([startYear, endYear]);
        } else {
            setYearRange([0, 0]);
        }
        setGoodPracticeType([]);
        setGoodPracticeArea([]);
        setGoodPracticeDrive([]);
        setGoodPracticeStage([]);
        setGoodPracticeRegion([]);
        setGoodPracticeCountry([]);
    }, [
        setYearRange,
        setGoodPracticeType,
        setGoodPracticeArea,
        setGoodPracticeDrive,
        setGoodPracticeStage,
        setGoodPracticeRegion,
        setGoodPracticeCountry,
        goodPracticeFilterResponse,
    ]);

    const minYear = goodPracticeFilterResponse?.goodPracticeFilterChoices.startYear ?? 0;
    const maxYear = goodPracticeFilterResponse?.goodPracticeFilterChoices.endYear ?? 0;
    const filterChoices = goodPracticeFilterResponse?.goodPracticeFilterChoices;

    const [
        typeFilterOptions,
        driverFilterOptions,
        areaFilterOptions,
        stageFilterOptions,
        regionFilterOptions,
        countryFilterOptions,
    ] = React.useMemo(() => [
        filterChoices?.type
            ?.map((v) => ({ key: v.name, label: v.label })),
        filterChoices?.driversOfDisplacement,
        filterChoices?.focusArea,
        filterChoices?.stage
            ?.map((v) => ({ key: v.name, label: v.label })),
        filterChoices?.regions
            ?.map((v) => ({ key: v.name, label: v.label })),
        filterChoices?.countries,
    ], [filterChoices]);

    const [
        isFiltered,
        goodPracticeVariables,
    ] = useMemo(() => ([
        searchText
            || goodPracticeCountry.length > 0
            || goodPracticeType.length > 0
            || goodPracticeArea.length > 0
            || goodpracticeStage.length > 0
            || goodPracticeRegion.length > 0
            || goodPracticeDrive.length > 0
            || yearRange[0] !== minYear
            || yearRange[1] !== maxYear,
        {
            search: searchText ?? '',
            countries: goodPracticeCountry,
            types: goodPracticeType,
            focusArea: goodPracticeArea,
            stages: goodpracticeStage,
            regions: goodPracticeRegion,
            driversOfDisplacements: goodPracticeDrive,
            startYear: yearRange[0],
            endYear: yearRange[1],
            limit: GOOD_PRACTICE_PAGE_SIZE,
            offset: 0,
            ordering,
        } as GoodPracticesQueryVariables,
    ]), [
        ordering,
        searchText,
        goodPracticeCountry,
        goodPracticeType,
        goodpracticeStage,
        goodPracticeRegion,
        goodPracticeDrive,
        goodPracticeArea,
        yearRange,
        minYear,
        maxYear,
    ]);

    const goodPracticeFilterVariables = useDebouncedValue(
        goodPracticeVariables,
        500,
    ) ?? goodPracticeVariables;

    const { data: faqsResponse } = useQuery<FaqsQuery, FaqsQueryVariables>(
        FAQS,
    );

    const {
        previousData,
        fetchMore: fetchMoreGoodPractice,
        data: goodPracticeResponse = previousData,
        error: goodPracticeError,
        loading: goodPracticeLoading,
        refetch: refetchGoodPractice,
    } = useQuery<GoodPracticesQuery, GoodPracticesQueryVariables>(
        GOOD_PRACTICES,
        { variables: goodPracticeFilterVariables },
    );

    const maxLimitShow = goodPracticeResponse?.goodPractices?.totalCount ?? 0;

    const goodPracticeList = React.useMemo(() => {
        const list = goodPracticeResponse?.goodPractices?.results;

        if (!list || list.length === 0) {
            return undefined;
        }

        const modifiedList: ((typeof list)[number] | undefined)[] = [...list];

        const remains = list.length % 3;
        if (remains !== 0) {
            for (let i = 0; i <= remains; i += 1) {
                modifiedList.push(undefined);
            }
        }

        return modifiedList;
    }, [goodPracticeResponse]);

    const { data: staticPageResponse } = useQuery<
        GoodPracticeListingStaticPageQuery,
        GoodPracticeListingStaticPageQueryVariables
    >(STATIC_PAGES);

    const [
        goodPracticeDescription,
        contactInformation,
        submitDescription,
    ] = React.useMemo(() => {
        const staticPageMap = listToMap(staticPageResponse?.staticPages, (d) => d.type);
        return [
            staticPageMap?.GOOD_PRACTICE_LISTING_PAGE?.description,
            staticPageMap?.GOOD_PRACTICE_CONTACT_INFORMATION?.description,
            staticPageMap?.SUBMIT_GOOD_PRACTICE?.description,
        ];
    }, [staticPageResponse]);

    const { data: mapResponse } = useQuery<
        GoodPracticeMapQuery,
        GoodPracticeMapQueryVariables
    >(GOOD_PRACTICE_MAP);

    const goodPracticeRendererParams = useCallback((
        _: string,
        d: GoodPracticeItemType | undefined,
    ) => ({
        goodPracticeId: d?.id,
        description: d?.description,
        title: d?.title,
        startYear: d?.startYear,
        endYear: d?.endYear,
        image: d?.image?.url,
        countries: unique(d?.countries?.map((t) => t.name) ?? []).join(', '),
        regions: unique(d?.countries?.map((t) => t.goodPracticeRegionLabel) ?? []).join(', '),
    }), []);

    const handleFaqExpansionChange = useCallback((newValue: boolean, name: string | undefined) => {
        setExpandedFaq(newValue === false ? undefined : name);
    }, []);

    const handleJumpToGoodPractices = useCallback(
        () => {
            if (practicesListRef.current) {
                practicesListRef.current.scrollIntoView({
                    behavior: 'smooth',
                });
            }
        },
        [],
    );

    const goodPractices = goodPracticeResponse?.goodPractices.results;
    const goodPracticesOffset = goodPractices?.length ?? 0;

    const handleShowMoreButtonClick = useCallback(() => {
        fetchMoreGoodPractice({
            variables: {
                ...goodPracticeVariables,
                offset: goodPracticesOffset,
                limit: GOOD_PRACTICE_PAGE_SIZE,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!previousResult.goodPractices) {
                    return previousResult;
                }

                return {
                    ...previousResult,
                    goodPractices: {
                        ...previousResult.goodPractices,
                        results: unique([
                            ...previousResult.goodPractices.results,
                            ...fetchMoreResult.goodPractices.results,
                        ], (d) => d.id),
                    },
                };
            },
        });
    }, [
        goodPracticeVariables,
        goodPracticesOffset,
        fetchMoreGoodPractice,
    ]);

    const handleShowLessButtonClick = useCallback(() => {
        refetchGoodPractice();
    }, [
        refetchGoodPractice,
    ]);

    const orderingOptionKeys = React.useMemo(
        () => (Object.keys(orderingOptions) as OrderingOptionType[]),
        [],
    );

    const orderingOptionList = React.useMemo(() => (
        orderingOptionKeys.map((k) => ({ key: k, label: orderingOptions[k] }))
    ), [orderingOptionKeys]);

    const filterElements = (
        <>
            {typeFilterOptions && typeFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    label="Type of Good Practice"
                    placeholder="Type of Good Practice"
                    name="type"
                    value={goodPracticeType}
                    options={typeFilterOptions}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onChange={setGoodPracticeType}
                    inputSectionClassName={styles.inputSection}
                />
            )}
            {regionFilterOptions && regionFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    placeholder="Region"
                    label="Region"
                    name="region"
                    value={goodPracticeRegion}
                    options={regionFilterOptions}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onChange={setGoodPracticeRegion}
                    inputSectionClassName={styles.inputSection}
                />
            )}
            {countryFilterOptions && countryFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    placeholder="Country"
                    label="Country"
                    name="country"
                    value={goodPracticeCountry}
                    options={countryFilterOptions}
                    keySelector={idSelector}
                    labelSelector={nameSelector}
                    onChange={setGoodPracticeCountry}
                    inputSectionClassName={styles.inputSection}
                />
            )}
            {driverFilterOptions && driverFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    placeholder="Drivers of Displacement"
                    label="Drivers of Displacement"
                    name="driversOfDisplacement"
                    value={goodPracticeDrive}
                    options={driverFilterOptions}
                    keySelector={idSelector}
                    labelSelector={nameSelector}
                    onChange={setGoodPracticeDrive}
                    inputSectionClassName={styles.inputSection}
                />
            )}
            {areaFilterOptions && areaFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    placeholder="Focus Area"
                    label="Focus Area"
                    name="focusArea"
                    value={goodPracticeArea}
                    options={areaFilterOptions}
                    keySelector={idSelector}
                    labelSelector={nameSelector}
                    onChange={setGoodPracticeArea}
                    inputSectionClassName={styles.inputSection}
                />
            )}
            {stageFilterOptions && stageFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    placeholder="Stage"
                    label="Stage"
                    name="stage"
                    value={goodpracticeStage}
                    options={stageFilterOptions}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onChange={setGoodPracticeStage}
                    inputSectionClassName={styles.inputSection}
                />
            )}
        </>
    );

    const searchAndTimeRange = (
        <div className={styles.searchAndTimeRangeContainer}>
            <TextInput
                labelContainerClassName={styles.label}
                inputSectionClassName={styles.inputSection}
                className={className}
                name="search"
                label="Search Good Practice"
                placeholder="Search Good Practice"
                value={searchText}
                onChange={setSearchText}
                // disabled={goodPracticeLoading}
                error={undefined}
                icons={(
                    <IoSearch />
                )}
            />
            <SliderInput
                labelDescription={`(${yearRange[0]} - ${yearRange[1]})`}
                min={minYear}
                max={maxYear}
                value={yearRange}
                step={1}
                minDistance={1}
                hideValues
                onChange={setYearRange}
            />
        </div>
    );

    const countries = mapResponse?.countries;
    const goodPracticeGeojson : GoodPracticeGeoJSON = useMemo(
        () => ({
            type: 'FeatureCollection',
            features: countries?.map((t) => {
                if (isNotDefined(t.goodPracticesCount) || t.goodPracticesCount <= 0) {
                    return undefined;
                }
                if (!t.centerPoint) {
                    return undefined;
                }
                return {
                    id: t.id,
                    type: 'Feature' as const,
                    properties: {
                        name: t.name,
                        value: t.goodPracticesCount,
                    },
                    geometry: {
                        type: 'Point' as const,
                        coordinates: t.centerPoint,
                    },
                };
            }).filter(isDefined) ?? [],
        }),
        [countries],
    );

    const [mapHoverLngLat, setMapHoverLngLat] = useState<LngLatLike>();
    const [
        mapHoverFeatureProperties,
        setMapHoverFeatureProperties,
    ] = useState<PopupProperties | undefined>(undefined);

    const handleMapPointClick = useCallback((features: mapboxgl.MapboxGeoJSONFeature) => {
        setGoodPracticeCountry([String(features.id)]);
        handleJumpToGoodPractices();
        return true;
    }, [
        setGoodPracticeCountry,
        handleJumpToGoodPractices,
    ]);

    const handleMouseEnter = useCallback(
        (feature: mapboxgl.MapboxGeoJSONFeature, lngLat: LngLat) => {
            const properties = feature.properties as PopupProperties;
            setMapHoverLngLat(lngLat);
            setMapHoverFeatureProperties(properties);
        },
        [],
    );

    const handleMouseLeave = useCallback(() => {
        setMapHoverLngLat(undefined);
        setMapHoverFeatureProperties(undefined);
    }, []);

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <div className={styles.headerSection}>
                <section
                    className={styles.profile}
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                    }}
                >
                    <div className={styles.container}>
                        <Header
                            darkMode
                            headingSize="extraLarge"
                            heading="Global Repository of Good Practices"
                            hideHeadingBorder
                        />
                        <EllipsizedContent darkMode>
                            <HTMLOutput value={goodPracticeDescription} />
                        </EllipsizedContent>
                        <Button
                            onClick={handleJumpToGoodPractices}
                            name={undefined}
                            variant="secondary"
                        >
                            Find Good Practices
                        </Button>
                    </div>
                </section>
            </div>
            <div className={styles.mainContent}>
                <section className={styles.map}>
                    <Header
                        headingSize="large"
                        heading="Good Practices around the world"
                    />
                    <Map
                        mapStyle={lightStyle}
                        mapOptions={{
                            logoPosition: 'bottom-left',
                            scrollZoom: false,
                            zoom: 1,
                        }}
                        scaleControlShown
                        navControlShown
                    >
                        <div className={styles.mapWrapper}>
                            <MapContainer className={styles.mapContainer} />
                            <MapSource
                                sourceKey="multi-points"
                                sourceOptions={sourceOption}
                                geoJson={goodPracticeGeojson}
                            >
                                <MapLayer
                                    layerKey="points-halo-circle"
                                    layerOptions={{
                                        type: 'circle',
                                        paint: orangePointHaloCirclePaint,
                                    }}
                                    onClick={handleMapPointClick}
                                    onMouseEnter={showTooltip ? handleMouseEnter : undefined}
                                    onMouseLeave={showTooltip ? handleMouseLeave : undefined}
                                />
                                {mapHoverLngLat && mapHoverFeatureProperties && (
                                    <MapTooltip
                                        coordinates={mapHoverLngLat}
                                        tooltipOptions={popupOptions}
                                    >
                                        <div>
                                            <div>
                                                {mapHoverFeatureProperties.name}
                                            </div>
                                            <div>
                                                {`Good Practice: ${mapHoverFeatureProperties.value}`}
                                            </div>
                                        </div>
                                    </MapTooltip>
                                )}
                            </MapSource>
                        </div>
                    </Map>
                </section>
                {((faqsResponse && faqsResponse.faqs.length > 0)
                    || submitDescription || contactInformation) && (
                    <section className={styles.faqSection}>
                        {faqsResponse && faqsResponse.faqs.length > 0 ? (
                            <div className={styles.faqList}>
                                <Header
                                    heading="Frequently asked questions"
                                    headingSize="large"
                                />
                                <div className={styles.content}>
                                    {faqsResponse?.faqs.map((faq, i) => (
                                        <React.Fragment key={faq.id}>
                                            <CollapsibleContent
                                                name={faq.id}
                                                onExpansionChange={handleFaqExpansionChange}
                                                isExpanded={expandedFaq === faq.id}
                                                header={faq?.question}
                                            >
                                                <EllipsizedContent>
                                                    <HTMLOutput
                                                        value={faq.answer}
                                                    />
                                                </EllipsizedContent>
                                            </CollapsibleContent>
                                            {i < (faqsResponse?.faqs.length - 1) && (
                                                <div className={styles.separator} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.faqList} />
                        )}
                        <div className={styles.sidePane}>
                            {submitDescription && (
                                <div className={styles.block}>
                                    <EllipsizedContent>
                                        <HTMLOutput
                                            value={submitDescription}
                                        />
                                    </EllipsizedContent>
                                </div>
                            )}
                            {contactInformation && (
                                <div className={styles.block}>
                                    <EllipsizedContent>
                                        <HTMLOutput
                                            value={contactInformation}
                                        />
                                    </EllipsizedContent>
                                </div>
                            )}
                        </div>
                    </section>
                )}
                <section
                    className={styles.goodPracticesContainer}
                    ref={practicesListRef}
                >
                    <Header
                        headingSize="large"
                        heading="Find Good Practices"
                    />
                    {searchAndTimeRange}
                    {!isSmallDisplay && (
                        <div className={styles.filterContainer}>
                            {filterElements}
                            {(!stageFilterOptions || stageFilterOptions.length === 0)
                                && <div />}
                            {(!areaFilterOptions || areaFilterOptions.length === 0)
                                && <div />}
                            {(!regionFilterOptions || regionFilterOptions.length === 0)
                                && <div />}
                            {(!countryFilterOptions || countryFilterOptions.length === 0)
                                && <div />}
                            {(!typeFilterOptions || typeFilterOptions.length === 0)
                                && <div />}
                            {(!driverFilterOptions || driverFilterOptions.length === 0)
                                && <div />}
                            <div />
                            <div />
                        </div>
                    )}
                    <div className={styles.filterList}>
                        {isFiltered && (
                            <>
                                {goodPracticeType.length > 0 && (
                                    <DismissableListOutput
                                        label="Type of Good Practice"
                                        value={goodPracticeType}
                                        keySelector={keySelector}
                                        labelSelector={labelSelector}
                                        options={typeFilterOptions}
                                        onChange={setGoodPracticeType}
                                    />
                                )}
                                {goodPracticeRegion.length > 0 && (
                                    <DismissableListOutput
                                        label="Region"
                                        value={goodPracticeRegion}
                                        keySelector={keySelector}
                                        labelSelector={labelSelector}
                                        options={regionFilterOptions}
                                        onChange={setGoodPracticeRegion}
                                    />
                                )}
                                {goodPracticeCountry.length > 0 && (
                                    <DismissableListOutput
                                        label="Country"
                                        value={goodPracticeCountry}
                                        keySelector={idSelector}
                                        labelSelector={nameSelector}
                                        options={countryFilterOptions}
                                        onChange={setGoodPracticeCountry}
                                    />
                                )}
                                {goodPracticeDrive.length > 0 && (
                                    <DismissableListOutput
                                        label="Drive Of Displacement"
                                        value={goodPracticeDrive}
                                        keySelector={idSelector}
                                        labelSelector={nameSelector}
                                        options={driverFilterOptions}
                                        onChange={setGoodPracticeDrive}
                                    />
                                )}
                                {goodPracticeArea.length > 0 && (
                                    <DismissableListOutput
                                        label="Focus Area"
                                        value={goodPracticeArea}
                                        keySelector={idSelector}
                                        labelSelector={nameSelector}
                                        options={areaFilterOptions}
                                        onChange={setGoodPracticeArea}
                                    />
                                )}
                                {goodpracticeStage.length > 0 && (
                                    <DismissableListOutput
                                        label="Stage"
                                        value={goodpracticeStage}
                                        keySelector={keySelector}
                                        labelSelector={labelSelector}
                                        options={stageFilterOptions}
                                        onChange={setGoodPracticeStage}
                                    />
                                )}
                                <div className={styles.clearAllContainer}>
                                    <Button
                                        name={undefined}
                                        onClick={handleClearFilterClick}
                                        variant="action"
                                        actions={<IoClose />}
                                        className={styles.clearFilterButton}
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            </>
                        )}
                        <div />
                    </div>
                    <div className={styles.separator} />
                    {isSmallDisplay && (
                        <div className={styles.mobileActions}>
                            <Button
                                variant="transparent"
                                onClick={setShowFilterModalTrue}
                                name={undefined}
                                actions={<IoFilter />}
                            >
                                Filter and Sort
                            </Button>
                            {showFiltersModal && (
                                <Modal
                                    heading="Filter"
                                    headingClassName={styles.heading}
                                    className={styles.mobileFilterModal}
                                    bodyClassName={styles.content}
                                    onCloseButtonClick={setShowFilterModalFalse}
                                >
                                    <RadioInput
                                        labelContainerClassName={styles.label}
                                        listContainerClassName={styles.radioList}
                                        name="sort"
                                        label="Sort Results by"
                                        options={orderingOptionList}
                                        onChange={setOrderingOptionValue}
                                        keySelector={(d) => d.key}
                                        labelSelector={(d) => d.label}
                                        value={orderingOptionValue}
                                    />
                                    <div className={styles.mobileFilters}>
                                        {filterElements}
                                    </div>
                                </Modal>
                            )}
                        </div>
                    )}
                    <div className={styles.gridContainer}>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                        >
                            {goodPracticeList && !isSmallDisplay && (
                                <div className={styles.orderingContainer}>
                                    <TabList>
                                        <Tab name="grid">
                                            <IoGridOutline />
                                        </Tab>
                                        <Tab name="list">
                                            <IoListOutline />
                                        </Tab>
                                    </TabList>
                                    <DropdownMenu
                                        className={styles.orderDropdown}
                                        label={`Sort: ${orderingOptions[orderingOptionValue]}`}
                                        variant="transparent"
                                    >
                                        {orderingOptionKeys.map((ok) => (
                                            <DropdownMenuItem
                                                key={ok}
                                                name={ok}
                                                onClick={setOrderingOptionValue}
                                            >
                                                {orderingOptions[ok]}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenu>
                                </div>
                            )}
                            <TabPanel name="grid">
                                <ListView
                                    className={styles.goodPracticeList}
                                    data={goodPracticeList}
                                    keySelector={goodPracticekeySelector}
                                    rendererParams={goodPracticeRendererParams}
                                    renderer={GoodPracticeItem}
                                    errored={!!goodPracticeError}
                                    pending={goodPracticeLoading}
                                    messageShown
                                    filtered={false}
                                    emptyMessage={(
                                        <div>
                                            No Good Practice Found
                                        </div>
                                    )}
                                    filteredEmptyMessage={(
                                        <div>
                                            No Filtered Good Practice Found
                                        </div>
                                    )}
                                />
                            </TabPanel>
                            <TabPanel name="list">
                                <ListView
                                    className={styles.goodPracticeGrid}
                                    data={goodPracticeList}
                                    keySelector={goodPracticekeySelector}
                                    rendererParams={goodPracticeRendererParams}
                                    renderer={GoodPracticeItem}
                                    errored={!!goodPracticeError}
                                    pending={goodPracticeLoading}
                                    messageShown
                                    filtered={false}
                                    emptyMessage={(
                                        <div>
                                            No Good Practice Found
                                        </div>
                                    )}
                                    filteredEmptyMessage={(
                                        <div>
                                            No Filtered Good Practice Found
                                        </div>
                                    )}
                                />
                            </TabPanel>
                        </Tabs>
                    </div>
                    <div className={styles.viewButtons}>
                        {goodPracticeList && maxLimitShow >= (
                            GOOD_PRACTICE_PAGE_SIZE + goodPracticesOffset
                        ) && (
                            // FIXME: need to hide this if there is no more good practice
                            <Button
                                className={styles.viewMoreButton}
                                name={undefined}
                                onClick={handleShowMoreButtonClick}
                                disabled={goodPracticeLoading}
                                variant="transparent"
                                actions={<IoArrowDown />}
                            >
                                View More Good Practices
                            </Button>
                        )}
                        {(goodPracticeList && goodPracticeList.length
                            > GOOD_PRACTICE_PAGE_SIZE) ? (
                                <Button
                                    className={styles.seeLessButton}
                                    name={undefined}
                                    onClick={handleShowLessButtonClick}
                                    disabled={goodPracticeLoading}
                                    variant="transparent"
                                    actions={<IoArrowUp />}
                                >
                                    Show Less
                                </Button>
                            ) : (
                                <div />
                            )}
                        <div />
                        <div />
                    </div>
                </section>
            </div>
        </div>
    );
}

export default GoodPractices;

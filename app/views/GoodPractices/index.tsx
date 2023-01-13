import React, { useEffect, useCallback, useMemo, useState } from 'react';
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
    Pager,
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
import LanguageSelectionInput from '#components/LanguageSelectInput';
import CollapsibleContent from '#components/CollapsibleContent';
import GoodPracticeItem from '#components/GoodPracticeItem';
import SliderInput from '#components/SliderInput';
import DismissableListOutput from '#components/DismissableListOutput';
import useBooleanState from '#hooks/useBooleanState';
import useModalState from '#hooks/useModalState';
import useInputState from '#hooks/useInputState';

import useDebouncedValue from '#hooks/useDebouncedValue';
import useDocumentSize from '#hooks/useDocumentSize';

import {
    goodPracticesDashboard,
    commonLabels,
} from '#base/configs/lang';
import useTranslation from '#hooks/useTranslation';
import generateString from '#utils/strings';

import AddGoodPractice from './AddGoodPractice';
import backgroundImage from '../../resources/img/backgroundImage.png';
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

function getOrderingOptions(str: { [key in string]: string }): {
    [key in OrderingOptionType]: string;
} {
    return ({
        recent: str.recentByPublicationLabel,
        oldest: str.oldestByPublicationLabel,
        mostPopular: str.mostPopularFirstLabel,
        leastPopular: str.leastPopularFirstLabel,
    });
}

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
        filtersModalShown,
        showFilterModal,
        hideFilterModal,
    ] = useBooleanState(false);

    const [
        addNewGoodPracticeModalShown,
        showNewGoodPracticeModal,
        hideNewGoodPracticeModal,
    ] = useModalState<boolean>(false);

    const strings = useTranslation(goodPracticesDashboard);
    const commonStrings = useTranslation(commonLabels);
    const orderingOptions = getOrderingOptions(commonStrings);

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

    const [activePage, setActivePage] = useState<number>(1);
    const offsetForGoodPratices = (activePage - 1) * GOOD_PRACTICE_PAGE_SIZE;

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
            offset: offsetForGoodPratices,
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
        offsetForGoodPratices,
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
        data: goodPracticeResponse = previousData,
        error: goodPracticeError,
        loading: goodPracticeLoading,
    } = useQuery<GoodPracticesQuery, GoodPracticesQueryVariables>(
        GOOD_PRACTICES,
        { variables: goodPracticeFilterVariables },
    );

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

    const goodPracticeListRendererParams = useCallback((
        _: string,
        d: GoodPracticeItemType | undefined,
    ) => ({
        className: styles.goodPracticeList,
        goodPracticeId: d?.id,
        description: d?.description,
        title: d?.title,
        startYear: d?.startYear,
        endYear: d?.endYear,
        image: d?.image?.url,
        countries: unique(d?.countries?.map((t) => t.name) ?? []).join(', '),
        regions: unique(d?.countries?.map((t) => t.goodPracticeRegionLabel) ?? []).join(', '),
    }), []);

    const goodPracticeGridRendererParams = useCallback((
        _: string,
        d: GoodPracticeItemType | undefined,
    ) => ({
        className: styles.goodPracticeGrid,
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

    const orderingOptionKeys = React.useMemo(
        () => (Object.keys(orderingOptions) as OrderingOptionType[]),
        [orderingOptions],
    );

    const orderingOptionList = React.useMemo(() => (
        orderingOptionKeys.map((k) => ({ key: k, label: orderingOptions[k] }))
    ), [
        orderingOptionKeys,
        orderingOptions,
    ]);

    const filterElements = (
        <>
            {typeFilterOptions && typeFilterOptions.length > 0 && (
                <MultiSelectInput
                    labelContainerClassName={styles.label}
                    label={strings.typeOfGoodPracticeHeader}
                    placeholder={strings.typeOfGoodPracticeHeader}
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
                    placeholder={strings.regionLabel}
                    label={strings.regionLabel}
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
                    placeholder={strings.countryLabel}
                    label={strings.countryLabel}
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
                    placeholder={strings.driversOfDisplacementLabel}
                    label={strings.driversOfDisplacementLabel}
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
                    placeholder={strings.focusAreaLabel}
                    label={strings.focusAreaLabel}
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
                    placeholder={strings.stageLabel}
                    label={strings.stageLabel}
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
                label={strings.searchFilterLabel}
                placeholder={strings.searchFilterLabel}
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
                label={strings.timescaleLabel}
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

    const handleNewGoodPracticeButtonClick = useCallback(() => {
        showNewGoodPracticeModal();
    }, [showNewGoodPracticeModal]);

    // NOTE: Adding style to body to disable scroll when modal is open
    useEffect(() => {
        if (addNewGoodPracticeModalShown || filtersModalShown) {
            document.body.classList.add(styles.modalOpen);
        }
        return (() => {
            document.body.classList.remove(styles.modalOpen);
        });
    }, [
        addNewGoodPracticeModalShown,
        filtersModalShown,
    ]);

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
                            heading={strings.goodPracticesHeader}
                            hideHeadingBorder
                        />
                        <HTMLOutput value={goodPracticeDescription} />
                        <Button
                            onClick={handleJumpToGoodPractices}
                            name={undefined}
                            variant="secondary"
                        >
                            {strings.findGoodPracticesButtonLabel}
                        </Button>
                        <LanguageSelectionInput
                            className={styles.languageSelection}
                        />
                    </div>
                </section>
            </div>
            <div className={styles.mainContent}>
                <section className={styles.map}>
                    <Header
                        headingSize="large"
                        heading={strings.goodPracticesAroundTheWorldLabel}
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
                                                {generateString(
                                                    strings.goodPracticeLabel,
                                                    { value: mapHoverFeatureProperties.value },
                                                )}
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
                                    heading={strings.faqHeader}
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
                                                <HTMLOutput
                                                    value={faq.answer}
                                                />
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
                            <div className={styles.block}>
                                {submitDescription && (
                                    <EllipsizedContent>
                                        <HTMLOutput
                                            value={submitDescription}
                                        />
                                    </EllipsizedContent>
                                )}
                                <Button
                                    name=""
                                    onClick={handleNewGoodPracticeButtonClick}
                                    className={styles.newGoodPractice}
                                >
                                    {strings.submitNewgoodPracticeLabel}
                                </Button>
                            </div>
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
                        heading={strings.goodPracticesHeader}
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
                                        label={strings.typeOfGoodPracticeHeader}
                                        value={goodPracticeType}
                                        keySelector={keySelector}
                                        labelSelector={labelSelector}
                                        options={typeFilterOptions}
                                        onChange={setGoodPracticeType}
                                    />
                                )}
                                {goodPracticeRegion.length > 0 && (
                                    <DismissableListOutput
                                        label={strings.regionLabel}
                                        value={goodPracticeRegion}
                                        keySelector={keySelector}
                                        labelSelector={labelSelector}
                                        options={regionFilterOptions}
                                        onChange={setGoodPracticeRegion}
                                    />
                                )}
                                {goodPracticeCountry.length > 0 && (
                                    <DismissableListOutput
                                        label={strings.countryLabel}
                                        value={goodPracticeCountry}
                                        keySelector={idSelector}
                                        labelSelector={nameSelector}
                                        options={countryFilterOptions}
                                        onChange={setGoodPracticeCountry}
                                    />
                                )}
                                {goodPracticeDrive.length > 0 && (
                                    <DismissableListOutput
                                        label={strings.driversOfDisplacementLabel}
                                        value={goodPracticeDrive}
                                        keySelector={idSelector}
                                        labelSelector={nameSelector}
                                        options={driverFilterOptions}
                                        onChange={setGoodPracticeDrive}
                                    />
                                )}
                                {goodPracticeArea.length > 0 && (
                                    <DismissableListOutput
                                        label={strings.focusAreaLabel}
                                        value={goodPracticeArea}
                                        keySelector={idSelector}
                                        labelSelector={nameSelector}
                                        options={areaFilterOptions}
                                        onChange={setGoodPracticeArea}
                                    />
                                )}
                                {goodpracticeStage.length > 0 && (
                                    <DismissableListOutput
                                        label={strings.stageLabel}
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
                                        {strings.clearButtonLabel}
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
                                onClick={showFilterModal}
                                name={undefined}
                                actions={<IoFilter />}
                            >
                                {strings.filterAndSortLabel}
                            </Button>
                            {filtersModalShown && (
                                <Modal
                                    heading="Filter"
                                    headingClassName={styles.heading}
                                    className={styles.mobileFilterModal}
                                    bodyClassName={styles.content}
                                    onClose={hideFilterModal}
                                    size="cover"
                                >
                                    <RadioInput
                                        labelContainerClassName={styles.label}
                                        listContainerClassName={styles.radioList}
                                        name="sort"
                                        label={strings.sortResultsByLabel}
                                        options={orderingOptionList}
                                        onChange={setOrderingOptionValue}
                                        keySelector={(d) => d.key}
                                        labelSelector={(d) => d.label}
                                        value={orderingOptionValue}
                                    />
                                    <div className={styles.mobileFilters}>
                                        {filterElements}
                                    </div>
                                    <div className={styles.emptyContent} />
                                </Modal>
                            )}
                        </div>
                    )}
                    <div>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            // variant="accent"
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
                                        label={`${strings.sortLabel}: ${orderingOptions[orderingOptionValue]}`}
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
                                    rendererParams={goodPracticeListRendererParams}
                                    renderer={GoodPracticeItem}
                                    errored={!!goodPracticeError}
                                    pending={goodPracticeLoading}
                                    messageShown
                                    filtered={false}
                                    emptyMessage={(
                                        <div>
                                            {strings.noGoodPracticeFoundMessage}
                                        </div>
                                    )}
                                    filteredEmptyMessage={(
                                        <div>
                                            {strings.noFilteredPracticesFoundMessage}
                                        </div>
                                    )}
                                />
                            </TabPanel>
                            <TabPanel name="list">
                                <ListView
                                    className={styles.goodPracticeGrid}
                                    data={goodPracticeList}
                                    keySelector={goodPracticekeySelector}
                                    rendererParams={goodPracticeGridRendererParams}
                                    renderer={GoodPracticeItem}
                                    errored={!!goodPracticeError}
                                    pending={goodPracticeLoading}
                                    messageShown
                                    filtered={false}
                                    emptyMessage={(
                                        <div>
                                            {strings.noGoodPracticeFoundMessage}
                                        </div>
                                    )}
                                    filteredEmptyMessage={(
                                        <div>
                                            {strings.noFilteredPracticesFoundMessage}
                                        </div>
                                    )}
                                />
                            </TabPanel>
                        </Tabs>
                    </div>
                    <div className={styles.footer}>
                        <Pager
                            activePage={activePage}
                            onActivePageChange={setActivePage}
                            maxItemsPerPage={GOOD_PRACTICE_PAGE_SIZE}
                            totalCapacity={3}
                            itemsCount={goodPracticeResponse?.goodPractices?.totalCount ?? 0}
                            itemsPerPageControlHidden
                        />
                    </div>
                </section>
                {addNewGoodPracticeModalShown && (
                    <AddGoodPractice
                        onModalClose={hideNewGoodPracticeModal}
                    />
                )}
            </div>
        </div>
    );
}

export default GoodPractices;

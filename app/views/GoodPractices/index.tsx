import React, { useCallback, useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    FaqsQueryVariables,
    FaqsQuery,
    GoodPracticesQuery,
    GoodPracticesQueryVariables,
    GoodPracticeListingStaticPageQuery,
    GoodPracticeListingStaticPageQueryVariables,
    GoodPracticeFilterChoicesQuery,
    GoodPracticeFilterChoicesQueryVariables,
} from '#generated/types';
import {
    TextInput,
    MultiSelectInput,
    ListView,
    DropdownMenu,
    DropdownMenuItem,
    useInputState,
} from '@the-deep/deep-ui';
import {
    _cs,
    listToMap,
    unique,
} from '@togglecorp/fujs';
import {
    IoSearch,
    IoClose,
    IoArrowDown,
} from 'react-icons/io5';

import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import CollapsibleContent from '#components/CollapsibleContent';
import GoodPracticeItem from '#components/GoodPracticeItem';
import SliderInput from '#components/SliderInput';

import useDebouncedValue from '../../hooks/useDebouncedValue';

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
    $driversOfDisplacements : [DriversOfDisplacementTypeEnum!],
    $focusArea:[FocusAreaEnum!] ,
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
            label
            name
        }
        focusArea {
            label
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
type countryFilterList = NonNullable<NonNullable<GoodPracticeFilterChoicesQuery['goodPracticeFilterChoices']>['countries']>[number];

const keySelector = (d: { key: string }) => d.key;
const labelSelector = (d: { label: string }) => d.label;

function countryKeySelector(d: countryFilterList) {
    return String(d.id);
}

function countryLabelSelector(d: countryFilterList) {
    return d.name;
}

function goodPracticekeySelector(d: GoodPracticeItemType | undefined, i: number) {
    return d?.id ?? String(i);
}

type OrderingOptionType = 'recent' | 'oldest' | 'mostPopular' | 'leastPopular';
const orderingOptions: {
    [key in OrderingOptionType]: string;
} = {
    recent: 'Recent first',
    oldest: 'Oldest first',
    mostPopular: 'Most Popular first',
    leastPopular: 'Least Popular first',
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

interface Props {
    className?: string;
}

function GoodPractices(props: Props) {
    const { className } = props;

    const practicesListRef = React.useRef<HTMLDivElement>(null);
    const [
        orderingOptionValue,
        setOrderingOptionValue,
    ] = React.useState<OrderingOptionType>('recent');

    const ordering = React.useMemo(() => (
        getOrderingFromOption(orderingOptionValue)
    ), [orderingOptionValue]);

    const [expandedFaq, setExpandedFaq] = useState<string>();
    const [searchText, setSearchText] = useState<string>();

    type GoodPracticeFilter = NonNullable<(typeof goodPracticeFilterResponse)>['goodPracticeFilterChoices'];
    type GoodPracticeTypeType = NonNullable<GoodPracticeFilter['type']>[number]['name'];
    type GoodPracticeAreaType = NonNullable<GoodPracticeFilter['focusArea']>[number]['name'];
    type GoodPracticeDriveType = NonNullable<GoodPracticeFilter['driversOfDisplacement']>[number]['name'];
    type GoodPracticeStageType = NonNullable<GoodPracticeFilter['stage']>[number]['name'];
    type GoodPracticeRegionType = NonNullable<GoodPracticeFilter['regions']>[number]['name'];
    type GoodPracticeCountryType = NonNullable<GoodPracticeFilter['countries']>[number]['name'];

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

    const typeFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.type
        ?.map((v) => ({ key: v.name, label: v.label }));

    const driverFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.driversOfDisplacement
        ?.map((v) => ({ key: v.name, label: v.label }));

    const areaFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.focusArea
        ?.map((v) => ({ key: v.name, label: v.label }));

    const stageFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.stage
        ?.map((v) => ({ key: v.name, label: v.label }));

    const regionFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.regions
        ?.map((v) => ({ key: v.name, label: v.label }));

    const countryFilter = goodPracticeFilterResponse?.goodPracticeFilterChoices.countries;

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
    }), []);

    const handleFaqExpansionChange = useCallback((newValue: boolean, name: string | undefined) => {
        if (newValue === false) {
            setExpandedFaq(undefined);
        } else {
            setExpandedFaq(name);
        }
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

    const orderingOptionKeys = React.useMemo(
        () => (Object.keys(orderingOptions) as OrderingOptionType[]),
        [],
    );

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <div className={styles.headerSection}>
                <section
                    className={styles.profile}
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1534271057238-c2c170a76672?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80")',
                    }}
                >
                    <div className={styles.container}>
                        <Header
                            darkMode
                            headingSize="extraLarge"
                            heading="Global Repositories for Good Practices"
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
                <section className={styles.faqSection}>
                    <div className={styles.faqList}>
                        <Header
                            heading="Frequently Asked Questions"
                            headingSize="large"
                        />
                        <div className={styles.content}>
                            {faqsResponse?.faqs.map((faq, i) => (
                                <React.Fragment key={faq.id}>
                                    <CollapsibleContent
                                        name={faq.id}
                                        onExpansionChange={handleFaqExpansionChange}
                                        isExpanded={expandedFaq === faq.id}
                                        header={`Q${i + 1}: ${faq?.question}`}
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
                    <div className={styles.sidePane}>
                        <div className={styles.block}>
                            <EllipsizedContent>
                                <HTMLOutput
                                    value={submitDescription}
                                />
                            </EllipsizedContent>
                        </div>
                        <div className={styles.block}>
                            <EllipsizedContent>
                                <HTMLOutput
                                    value={contactInformation}
                                />
                            </EllipsizedContent>
                        </div>
                    </div>
                </section>
                <section
                    className={styles.goodPracticesContainer}
                    ref={practicesListRef}
                >
                    <Header
                        headingSize="large"
                        heading="Find Good Practices"
                    />
                    <div className={styles.searchAndTimeRangeContainer}>
                        <TextInput
                            labelContainerClassName={styles.label}
                            variant="general"
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
                            labelDescription={`${yearRange[0]} - ${yearRange[1]}`}
                            min={minYear}
                            max={maxYear}
                            value={yearRange}
                            step={1}
                            minDistance={1}
                            hideValues
                            onChange={setYearRange}
                        />
                    </div>
                    <div className={styles.filterContainer}>
                        {typeFilter && typeFilter.length > 0 && (
                            <MultiSelectInput
                                labelContainerClassName={styles.label}
                                label="Type of Good Practice"
                                variant="general"
                                placeholder="Type of Good Practice"
                                name="type"
                                value={goodPracticeType}
                                options={typeFilter}
                                keySelector={keySelector}
                                labelSelector={labelSelector}
                                onChange={setGoodPracticeType}
                                inputSectionClassName={styles.inputSection}
                            />
                        )}
                        {regionFilter && regionFilter.length > 0 && (
                            <MultiSelectInput
                                labelContainerClassName={styles.label}
                                variant="general"
                                placeholder="Region"
                                label="Region"
                                name="region"
                                value={goodPracticeRegion}
                                options={regionFilter}
                                keySelector={keySelector}
                                labelSelector={labelSelector}
                                onChange={setGoodPracticeRegion}
                                inputSectionClassName={styles.inputSection}
                            />
                        )}
                        {countryFilter && countryFilter.length > 0 && (
                            <MultiSelectInput
                                labelContainerClassName={styles.label}
                                variant="general"
                                placeholder="Country"
                                label="Country"
                                name="country"
                                value={goodPracticeCountry}
                                options={countryFilter}
                                keySelector={countryKeySelector}
                                labelSelector={countryLabelSelector}
                                onChange={setGoodPracticeCountry}
                                inputSectionClassName={styles.inputSection}
                            />
                        )}
                        {driverFilter && driverFilter.length > 0 && (
                            <MultiSelectInput
                                labelContainerClassName={styles.label}
                                variant="general"
                                placeholder="Drivers of Displacement"
                                label="Drivers of Displacement"
                                name="driversOfDisplacement"
                                value={goodPracticeDrive}
                                options={driverFilter}
                                keySelector={keySelector}
                                labelSelector={labelSelector}
                                onChange={setGoodPracticeDrive}
                                inputSectionClassName={styles.inputSection}
                            />
                        )}
                        {areaFilter && areaFilter.length > 0 && (
                            <MultiSelectInput
                                labelContainerClassName={styles.label}
                                variant="general"
                                placeholder="Focus Area"
                                label="Focus Area"
                                name="focusArea"
                                value={goodPracticeArea}
                                options={areaFilter}
                                keySelector={keySelector}
                                labelSelector={labelSelector}
                                onChange={setGoodPracticeArea}
                                inputSectionClassName={styles.inputSection}
                            />
                        )}
                        {stageFilter && stageFilter.length > 0 && (
                            <MultiSelectInput
                                labelContainerClassName={styles.label}
                                variant="general"
                                placeholder="Stage"
                                label="Stage"
                                name="stage"
                                value={goodpracticeStage}
                                options={stageFilter}
                                keySelector={keySelector}
                                labelSelector={labelSelector}
                                onChange={setGoodPracticeStage}
                                inputSectionClassName={styles.inputSection}
                            />
                        )}
                        {(!stageFilter || stageFilter.length === 0) && <div />}
                        <div />
                        <div />
                    </div>
                    <div className={styles.filterActions}>
                        {isFiltered && (
                            <Button
                                name={undefined}
                                onClick={handleClearFilterClick}
                                variant="action"
                                actions={<IoClose />}
                                className={styles.clearFilterButton}
                            >
                                Clear all filters
                            </Button>
                        )}
                        <div />
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.orderingContainer}>
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
                    <ListView
                        className={styles.goodPracticeList}
                        data={goodPracticeList}
                        keySelector={goodPracticekeySelector}
                        rendererParams={goodPracticeRendererParams}
                        renderer={GoodPracticeItem}
                        errored={!!goodPracticeError}
                        pending={goodPracticeLoading}
                        filtered={false}
                    />
                    <Button
                        name={undefined}
                        onClick={handleShowMoreButtonClick}
                        disabled={goodPracticeLoading}
                        variant="action"
                        actions={<IoArrowDown />}
                    >
                        View more Good Practices
                    </Button>
                </section>
            </div>
        </div>
    );
}

export default GoodPractices;

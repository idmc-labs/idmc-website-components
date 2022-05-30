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
    SelectInput,
    ListView,
    useInputState,
} from '@the-deep/deep-ui';
import {
    _cs,
    listToMap,
    unique,
    isDefined,
} from '@togglecorp/fujs';
import { IoSearch } from 'react-icons/io5';

import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import CollapsibleContent from '#components/CollapsibleContent';
import GoodPracticeItem from '#components/GoodPracticeItem';

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
    $regions: [RegionEnum!],
    $countries: [ID!],
    $limit: Int!,
    $offset: Int!,
) {
    goodPractices(
        ordering: {},
        filters: {
            search: $search,
            types: $types,
            driversOfDisplacements: $driversOfDisplacements,
            focusArea: $focusArea,
            stages: $stages,
            regions: $regions,
            countries: $countries,
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
    return d.id;
}

function countryLabelSelector(d: countryFilterList) {
    return d.name;
}

function goodPracticekeySelector(d: GoodPracticeItemType | undefined, i: number) {
    return d?.id ?? String(i);
}

interface Props {
    className?: string;
}

function GoodPractices(props: Props) {
    const { className } = props;

    const practicesListRef = React.useRef<HTMLDivElement>(null);

    const [expandedFaq, setExpandedFaq] = useState<string>();
    const [searchText, setSearchText] = useState<string>();
    const debouncedSearchText = useDebouncedValue(searchText);

    const [goodPracticeType, setGoodPracticeType] = useInputState<string | undefined>(undefined);
    const [goodPracticeArea, setGoodPracticeArea] = useInputState<string | undefined>(undefined);
    const [goodPracticeDrive, setGoodPracticeDrive] = useInputState<string | undefined>(undefined);
    const [goodpracticeStage, setGoodPracticeStage] = useInputState<string | undefined>(undefined);
    const [
        goodPracticeRegion,
        setGoodPracticeRegion,
    ] = useInputState<string | undefined>(undefined);
    const [
        goodPracticeCountry,
        setGoodPracticeCountry,
    ] = useInputState<string | undefined>(undefined);

    const goodPracticeVariables = useMemo(() => ({
        search: debouncedSearchText ?? '',
        countries: isDefined(goodPracticeCountry) ? [goodPracticeCountry] : [],
        types: isDefined(goodPracticeType) ? [goodPracticeType] : [],
        focusArea: isDefined(goodPracticeArea) ? [goodPracticeArea] : [],
        stages: isDefined(goodpracticeStage) ? [goodpracticeStage] : [],
        regions: isDefined(goodPracticeRegion) ? [goodPracticeRegion] : [],
        driversOfDisplacements: isDefined(goodPracticeDrive) ? [goodPracticeDrive] : [],
        limit: GOOD_PRACTICE_PAGE_SIZE,
        offset: 0,
    }), [
        debouncedSearchText,
        goodPracticeCountry,
        goodPracticeType,
        goodpracticeStage,
        goodPracticeRegion,
        goodPracticeDrive,
        goodPracticeArea,
    ]);

    const {
        data: faqsResponse,
    } = useQuery<FaqsQuery, FaqsQueryVariables>(
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
        { variables: goodPracticeVariables },
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

    const {
        data: goodPracticeFilterResponse,
    } = useQuery<GoodPracticeFilterChoicesQuery, GoodPracticeFilterChoicesQueryVariables>(
        GOOD_PRACTICE_FILTER_CHOICES,
    );

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
                            <HTMLOutput
                                value={goodPracticeDescription}
                            />
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
                        {faqsResponse?.faqs.map((faq, i) => (
                            <CollapsibleContent
                                key={faq.id}
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
                        ))}
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
                    <div>
                        <TextInput
                            className={className}
                            name="search"
                            placeholder="Search Good Practice"
                            value={searchText}
                            onChange={setSearchText}
                            // disabled={goodPracticeLoading}
                            error={undefined}
                            icons={(
                                <IoSearch />
                            )}
                        />
                    </div>
                    <div className={styles.filterContainer}>
                        <SelectInput
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
                        <SelectInput
                            variant="general"
                            placeholder="Drivers of Displacement"
                            name="driversOfDisplacement"
                            value={goodPracticeDrive}
                            options={driverFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeDrive}
                            inputSectionClassName={styles.inputSection}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Focus Area"
                            name="focusArea"
                            value={goodPracticeArea}
                            options={areaFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeArea}
                            inputSectionClassName={styles.inputSection}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Stage"
                            name="stage"
                            value={goodpracticeStage}
                            options={stageFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeStage}
                            inputSectionClassName={styles.inputSection}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Region"
                            name="region"
                            value={goodPracticeRegion}
                            options={regionFilter}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            onChange={setGoodPracticeRegion}
                            inputSectionClassName={styles.inputSection}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Country"
                            name="country"
                            value={goodPracticeCountry}
                            options={countryFilter}
                            keySelector={countryKeySelector}
                            labelSelector={countryLabelSelector}
                            onChange={setGoodPracticeCountry}
                            inputSectionClassName={styles.inputSection}
                        />
                        <div />
                        <div />
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
                    >
                        Show More
                    </Button>
                </section>
            </div>
        </div>
    );
}

export default GoodPractices;

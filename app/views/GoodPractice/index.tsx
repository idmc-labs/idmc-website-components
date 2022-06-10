import React from 'react';
import {
    _cs,
    isNotDefined,
    listToMap,
    isDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import { IoChevronForward } from 'react-icons/io5';

import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TextOutput from '#components/TextOutput';
import Carousel from '#components/Carousel';
import CarouselItem from '#components/Carousel/CarouselItem';
import CarouselButton from '#components/Carousel/CarouselButton';
import GoodPracticeItem from '#components/GoodPracticeItem';

import {
    GoodPracticeDetailsQuery,
    GoodPracticeDetailsQueryVariables,
    RelatedGoodPracticeListQuery,
    RelatedGoodPracticeListQueryVariables,
    GoodPracticeListingStaticPageQuery,
    GoodPracticeListingStaticPageQueryVariables,
    IncrementPageViewMutation,
    IncrementPageViewMutationVariables,
} from '#generated/types';

import { getGoodPracticesLink } from '#utils/common';

import styles from './styles.css';

// TODO: remove this
const defaultCover = 'https://images.unsplash.com/photo-1465917566611-efba2904dd8a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1476&q=80';

const GOOD_PRACTICE = gql`
query GoodPracticeDetails($id: ID!) {
    goodPractice(pk: $id) {
        description
        endYear
        countries {
            id
            name
            goodPracticeRegion
            goodPracticeRegionLabel
        }
        gallery {
          caption
          id
          image {
            name
            url
          }
          youtubeVideoUrl
        }
        id
        image {
          name
          url
        }
        mediaAndResourceLinks
        startYear
        title
    }

    regionList: __type(name: "GoodPracticeRegion") {
        enumValues {
            name
            description
        }
    }
}
`;

const RELATED_GOOD_PRACTICE = gql`
query RelatedGoodPracticeList($id: ID!) {
    goodPractices(ordering: {}, filters: { recommendedGoodPractice: $id }, pagination: {limit: 6, offset: 0}) {
        results {
            id
            title
            description
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

const PAGE_COUNT = gql`
mutation IncrementPageView($id: ID!) {
    incrementPageViewedCount(input: {id: $id}) {
        ... on GoodPracticeType {
            id
        }
    }
}
`;

interface Props {
    className?: string;
    id: string | undefined;
}

function GoodPractice(props: Props) {
    const {
        className,
        id,
    } = props;

    const [
        incrementPageCount,
    ] = useMutation<IncrementPageViewMutation, IncrementPageViewMutationVariables>(PAGE_COUNT);

    React.useEffect(() => {
        let timeout: number;
        if (isDefined(id)) {
            timeout = window.setTimeout(
                () => {
                    incrementPageCount({ variables: { id } });
                },
                10000,
            );
        }

        return () => { window.clearTimeout(timeout); };
    }, [incrementPageCount, id]);

    const {
        data,
    } = useQuery<GoodPracticeDetailsQuery, GoodPracticeDetailsQueryVariables>(
        GOOD_PRACTICE,
        {
            skip: isNotDefined(id),
            variables: { id: id ?? '' },
        },
    );

    const countryText = data
        ?.goodPractice.countries
        ?.map((c) => c.name)
        .join(', ');

    const regionLabel = data
        ?.goodPractice.countries
        ?.map((c) => c.goodPracticeRegionLabel)
        .join(', ');

    const {
        data: relatedData,
    } = useQuery<RelatedGoodPracticeListQuery, RelatedGoodPracticeListQueryVariables>(
        RELATED_GOOD_PRACTICE,
        {
            skip: isNotDefined(id),
            variables: { id: id ?? '' },
        },
    );

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

    const relatedGoodPracticeList = React.useMemo(() => {
        const list = relatedData?.goodPractices?.results;

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
    }, [relatedData]);

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <div className={styles.headerSection}>
                <div
                    className={styles.basicInfo}
                    style={{
                        backgroundImage: `url("${data?.goodPractice?.image?.url ?? defaultCover}")`,
                    }}
                >
                    <div className={styles.container}>
                        <div className={styles.breadcrumbs}>
                            <a href="/">
                                Home
                            </a>
                            <IoChevronForward />
                            <a href={getGoodPracticesLink()}>
                                Good Practices
                            </a>
                        </div>
                        <Header
                            headingSize="extraLarge"
                            heading={data?.goodPractice?.title}
                            darkMode
                            hideHeadingBorder
                        />
                        <EllipsizedContent darkMode>
                            <HTMLOutput
                                value={goodPracticeDescription}
                            />
                        </EllipsizedContent>
                    </div>
                </div>
            </div>
            <div className={styles.mainContent}>
                <section className={styles.details}>
                    <div className={styles.mainSection}>
                        <div className={styles.meta}>
                            <TextOutput
                                hideLabelColon
                                label="Region"
                                value={regionLabel}
                                strongValue
                                displayType="block"
                            />
                            <TextOutput
                                hideLabelColon
                                label="Country"
                                value={countryText}
                                strongValue
                                displayType="block"
                            />
                            <TextOutput
                                hideLabelColon
                                label="Timeframe"
                                value={(
                                    <div>
                                        <span>
                                            {data?.goodPractice?.startYear}
                                        </span>
                                        <span>
                                            &nbsp;-&nbsp;
                                        </span>
                                        <span>
                                            {data?.goodPractice?.endYear ?? 'Ongoing'}
                                        </span>
                                    </div>
                                )}
                                strongValue
                                displayType="block"
                            />
                        </div>
                        {data?.goodPractice.description && (
                            <HTMLOutput
                                value={data?.goodPractice?.description}
                            />
                        )}
                    </div>
                    <div className={styles.sidePane}>
                        {(data?.goodPractice?.gallery?.length ?? 0) > 0 && (
                            <div className={styles.carouselContainer}>
                                <Header
                                    heading="Best Practice Gallery"
                                    headingSize="small"
                                />
                                <Carousel className={styles.carousel}>
                                    {data?.goodPractice?.gallery?.map((ci, i) => (
                                        <CarouselItem
                                            key={ci.id}
                                            order={i + 1}
                                            className={styles.carouselItem}
                                            expandedClassName={styles.expandedCarouselItem}
                                        >
                                            {ci.image && (
                                                <img
                                                    className={styles.image}
                                                    alt={ci.image.name}
                                                    src={ci.image.url}
                                                />
                                            )}
                                            {!ci.image && ci.youtubeVideoUrl && (
                                                <iframe
                                                    className={styles.videoEmbed}
                                                    title={ci.caption ?? ci.id}
                                                    src={ci.youtubeVideoUrl}
                                                />
                                            )}
                                            <EllipsizedContent className={styles.description}>
                                                <HTMLOutput
                                                    value={ci.caption}
                                                />
                                            </EllipsizedContent>
                                        </CarouselItem>
                                    ))}
                                    <div className={styles.carouselActions}>
                                        {data?.goodPractice?.gallery?.map((ci, i) => (
                                            <CarouselButton
                                                key={ci.id}
                                                action="set"
                                                order={i + 1}
                                            />
                                        ))}
                                    </div>
                                </Carousel>
                            </div>
                        )}
                        <div className={styles.blockList}>
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
                    </div>
                </section>
                {data?.goodPractice.mediaAndResourceLinks && (
                    <section className={styles.mediaAndResourceLinks}>
                        <Header
                            headingSize="large"
                            heading="Media and Resources"
                        />
                        <HTMLOutput
                            value={data?.goodPractice?.mediaAndResourceLinks}
                        />
                    </section>
                )}
                <section className={styles.relatedSection}>
                    <Header
                        headingSize="large"
                        heading="Related Materials"
                    />
                    <div className={styles.relatedGoodPracticeList}>
                        {relatedGoodPracticeList?.map((gp, i) => (
                            <GoodPracticeItem
                                key={gp?.id ?? i}
                                goodPracticeId={gp?.id}
                                title={gp?.title}
                                description={gp?.description}
                                startYear={gp?.startYear}
                                endYear={gp?.endYear}
                                image={gp?.image?.url}
                                countries={undefined}
                                regions={undefined}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default GoodPractice;

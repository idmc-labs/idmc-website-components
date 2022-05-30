import React from 'react';
import {
    _cs,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoChevronForward,
    IoChevronBack,
    IoEllipseOutline,
} from 'react-icons/io5';

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
} from '#generated/types';

import styles from './styles.css';

const GOOD_PRACTICE = gql`
query GoodPracticeDetails($id: ID!) {
    goodPractice(pk: $id) {
        description
        endYear
        driversOfDisplacement
        focusArea
        countries {
            id
            name
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
        goodPracticeFormUrl
        id
        image {
          name
          url
        }
        isPublished
        mediaAndResourceLinks
        publishedDate
        pageViewedCount
        stage
        startYear
        title
        type
    }

    regionList: __type(name: "RegionEnum") {
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

interface Props {
    className?: string;
    id: string | undefined;
}

function GoodPractice(props: Props) {
    const {
        className,
        id,
    } = props;

    const {
        data,
    } = useQuery<GoodPracticeDetailsQuery, GoodPracticeDetailsQueryVariables>(
        GOOD_PRACTICE,
        {
            skip: isNotDefined(id),
            variables: { id: id ?? '' },
        },
    );

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

    console.info(data, relatedData);

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <div className={styles.headerSection}>
                <div
                    className={styles.basicInfo}
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1465917566611-efba2904dd8a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1476&q=80")',
                    }}
                >
                    <div className={styles.container}>
                        <div className={styles.breadcrumbs}>
                            <a href="/">
                                Home
                            </a>
                            ›
                            {/* TODO: use actual link */}
                            <a href="?page=good-practices">
                                Good Practices
                            </a>
                        </div>
                        <Header
                            headingSize="extraLarge"
                            heading={data?.goodPractice?.title}
                            darkMode
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
                                label="Region"
                                // TODO: add value
                                value="-"
                                strongValue
                                displayType="block"
                            />
                            <TextOutput
                                label="Country"
                                value={data?.goodPractice.countries.map((c) => c.name).join(', ')}
                                strongValue
                                displayType="block"
                            />
                            <TextOutput
                                label="Timeframe"
                                value={(
                                    <div>
                                        <span>
                                            {data?.goodPractice?.startYear}
                                        </span>
                                        <span>
                                            -
                                        </span>
                                        <span>
                                            {data?.goodPractice?.endYear}
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
                        {data?.goodPractice.mediaAndResourceLinks && (
                            <div className={styles.mediaAndResourceLinks}>
                                <Header
                                    headingSize="large"
                                    heading="Media and Resources"
                                />
                                <HTMLOutput
                                    value={data?.goodPractice?.mediaAndResourceLinks}
                                />
                            </div>
                        )}
                    </div>
                    <div className={styles.sidePane}>
                        <div className={styles.carouselContainer}>
                            <Header
                                heading="Best Practice"
                                headingSize="small"
                            />
                            <Carousel className={styles.carousel}>
                                {data?.goodPractice?.gallery?.map((ci, i) => (
                                    <CarouselItem
                                        key={ci.id}
                                        order={i + 1}
                                        className={styles.carouselItem}
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
                                    <CarouselButton
                                        action="prev"
                                    >
                                        <IoChevronBack />
                                    </CarouselButton>
                                    {data?.goodPractice?.gallery?.map((ci, i) => (
                                        <CarouselButton
                                            key={ci.id}
                                            action="set"
                                            order={i + 1}
                                        >
                                            <IoEllipseOutline />
                                        </CarouselButton>
                                    ))}
                                    <CarouselButton
                                        action="next"
                                    >
                                        <IoChevronForward />
                                    </CarouselButton>
                                </div>
                            </Carousel>
                        </div>
                        <div className={styles.blockList}>
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
                    </div>
                </section>
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
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default GoodPractice;

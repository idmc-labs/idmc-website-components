import React from 'react';
import {
    _cs,
    isNotDefined,
    listToMap,
    isDefined,
    unique,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import { IoChevronForward } from 'react-icons/io5';

import Header from '#components/Header';
import Button from '#components/Button';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TextOutput from '#components/TextOutput';
import Carousel from '#components/Carousel';
import CarouselItem from '#components/Carousel/CarouselItem';
import CarouselButton from '#components/Carousel/CarouselButton';
import LanguageSelectionInput from '#components/LanguageSelectInput';
import GoodPracticeItem from '#components/GoodPracticeItem';
import AddGoodPractice from '#views/GoodPractices/AddGoodPractice';

import { goodPracticeItem } from '#base/configs/lang';
import useTranslation from '#hooks/useTranslation';
import useModalState from '#hooks/useModalState';

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
        implementingEntity
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
    incrementPageViewedCount(id: $id) {
        ... on GoodPracticePageViewCountType {
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

    const [
        addNewGoodPracticeModalShown,
        showNewGoodPracticeModal,
        hideNewGoodPracticeModal,
    ] = useModalState<boolean>(false);

    const strings = useTranslation(goodPracticeItem);

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

    const countryText = unique(data
        ?.goodPractice.countries
        ?.map((c) => c.name)
        ?.filter((c) => !!c)
            ?? []).join(', ') || '-';

    const regionLabel = unique(data
        ?.goodPractice.countries
        ?.map((c) => c.goodPracticeRegionLabel)
        ?.filter((c) => !!c)
            ?? []).join(', ') || '-';

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
                        backgroundImage: `url("${data?.goodPractice?.image?.url}")`,
                    }}
                >
                    <div className={styles.container}>
                        <div className={styles.breadcrumbs}>
                            <a href="/">
                                {strings.homeLabel}
                            </a>
                            <IoChevronForward />
                            <a href={getGoodPracticesLink()}>
                                {strings.goodPracticesLabel}
                            </a>
                        </div>
                        <Header
                            headingSize="extraLarge"
                            heading={data?.goodPractice?.title}
                            darkMode
                            hideHeadingBorder
                        />
                        <HTMLOutput
                            value={goodPracticeDescription}
                        />
                        <LanguageSelectionInput
                            className={styles.languageSelection}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.mainContent}>
                <section className={styles.details}>
                    <div className={styles.mainSection}>
                        <div>
                            <div className={styles.meta}>
                                <TextOutput
                                    hideLabelColon
                                    label={strings.regionLabel}
                                    value={regionLabel}
                                    strongValue
                                    displayType="block"
                                />
                                <TextOutput
                                    hideLabelColon
                                    label={strings.countryLabel}
                                    value={countryText}
                                    strongValue
                                    displayType="block"
                                />
                            </div>
                            <div className={styles.meta}>
                                <TextOutput
                                    hideLabelColon
                                    label={strings.timeframeLabel}
                                    value={(
                                        <div>
                                            <span>
                                                {data?.goodPractice?.startYear}
                                            </span>
                                            <span>
                                                &nbsp;-&nbsp;
                                            </span>
                                            <span>
                                                {data?.goodPractice?.endYear
                                                ?? strings.ongoingLabel}
                                            </span>
                                        </div>
                                    )}
                                    strongValue
                                    displayType="block"
                                />
                                <TextOutput
                                    hideLabelColon
                                    label={strings.implementingEntityLabel}
                                    // Note: || used instead of ?? due to empty string
                                    value={data?.goodPractice?.implementingEntity || '-'}
                                    strongValue
                                    displayType="block"
                                />
                            </div>
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
                                    heading={strings.bestPracticeGalleryLabel}
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
                                    <h4>
                                        {strings.addNewGoodPracticeHeading}
                                    </h4>
                                    <Button
                                        name={undefined}
                                        onClick={showNewGoodPracticeModal}
                                    >
                                        {strings.submitNewGoodPracticeLabel}
                                    </Button>
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
                            heading={strings.mediaAndResourcesLabel}
                        />
                        <HTMLOutput
                            value={data?.goodPractice?.mediaAndResourceLinks}
                        />
                    </section>
                )}
                <section className={styles.relatedSection}>
                    <Header
                        headingSize="large"
                        heading={strings.relatedMaterialsLabel}
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
                {addNewGoodPracticeModalShown && (
                    <AddGoodPractice
                        onModalClose={hideNewGoodPracticeModal}
                    />
                )}
            </div>
        </div>
    );
}

export default GoodPractice;

import React, {
    useMemo,
    useState,
} from 'react';
import { Pager } from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    _cs,
    compareNumber,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    CountryProfileQuery,
    CountryProfileQueryVariables,
    RelatedMaterialsQuery,
    RelatedMaterialsQueryVariables,
} from '#generated/types';

import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TextOutput from '#components/TextOutput';
import RelatedMaterialItem from '#components/RelatedMaterialItem';
import TooltipIcon from '#components/TooltipIcon';
import FigureAnalysis from '#components/FigureAnalysis';

import {
    getMaximum,
} from '#utils/common';

import IduWidget from '../IduWidget';
import ConflictWidget from '../ConflictWidget';
import DisasterWidget from '../DisasterWidget';

import { countryMetadata } from './data';

import styles from './styles.css';

const contentTypeLabelMapping: {
    [key: string]: string,
} = {
    events: 'Event',
    expert_opinion: 'Expert analysis',
    iframe: 'Feature',
    good_practice: 'Good practice',
    media_centre: 'Expert analysis',
    publications: 'Publication',
    shorthand: 'Feature',
    partner_spotlight: 'Project spotlight',
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

const COUNTRY_PROFILE = gql`
    query CountryProfile($iso3: String!) {
        countryProfile(iso3: $iso3) {
            id
            name
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

export interface Props {
    className?: string;
    iso3: string;
    countryName?: string;
    endYear: number;
    clientCode: string;
}

function CountryProfile(props: Props) {
    const {
        className,
        iso3: currentCountry,
        countryName,
        endYear: year,
        clientCode,
    } = props;

    // Overview section
    const [overviewActiveYear, setOverviewActiveYear] = useState<string>(String(year));

    // IDU map section
    const {
        previousData,
        data: countryProfileData = previousData,
        // TODO: handle loading and error
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
                    const latestYear = getMaximum(
                        overviews,
                        (overview1, overview2) => compareNumber(overview1.year, overview2.year),
                    );
                    if (latestYear) {
                        setOverviewActiveYear(latestYear.year.toString());
                    }
                }
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
        // TODO: handle loading and error
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

    const disasterSection = DisasterWidget({
        iso3: currentCountry,
        endYear: year,
        clientCode,
    });

    const conflictSection = ConflictWidget({
        iso3: currentCountry,
        endYear: year,
        clientCode,
    });

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
                <FigureAnalysis
                    iso3={currentCountry}
                    endYear={year}
                    cause="CONFLICT"
                    clientCode={clientCode}
                />
                {disasterSection}
                <FigureAnalysis
                    iso3={currentCountry}
                    endYear={year}
                    cause="DISASTER"
                    clientCode={clientCode}
                />
            </div>
        </section>
    );

    const internalDisplacementUpdatesSection = IduWidget({
        iso3: currentCountry,
        clientCode,
    });

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
                        coverImageUrl={gp.metatag.value.og_image_0}
                        url={gp.metatag.value.canonical_url}
                        heading={gp.metatag.value.title}
                        description={gp.metatag.value.description}
                        // TODO: pass date
                        // TODO: pass doc type
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

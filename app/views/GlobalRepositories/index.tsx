import React from 'react';
import {
    Button,
    TextInput,
    SelectInput,
} from '@the-deep/deep-ui';
import Map, {
    MapContainer,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import { _cs } from '@togglecorp/fujs';
import { IoSearch } from 'react-icons/io5';

import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import CollapsibleContent from '#components/CollapsibleContent';

import { goodPracticeMeta, goodPracticesGeoJson } from './data';
import styles from './styles.css';

const orangePointHaloCirclePaint: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-color': {
        property: 'status',
        type: 'categorical',
        stops: [
            ['recently_submitted', 'rgb(239, 125, 0)'],
            ['under_review', 'rgb(1, 142, 202)'],
            ['approved', 'rgb(51, 149, 62)'],
        ],
    },
    'circle-radius': 9,
};

const options: { key: string; label: string }[] = [];

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = 'mapbox://styles/mapbox/light-v10';

interface Props {
    className?: string;
}

function GlobalRepositories(props: Props) {
    const {
        className,
    } = props;

    const [expandedFaq, setExpandedFaq] = React.useState<number>();

    const handleFaqExpansionChange = React.useCallback((newValue: boolean, name: number) => {
        if (newValue === false) {
            setExpandedFaq(undefined);
        } else {
            setExpandedFaq(name);
        }
    }, []);

    return (
        <div className={_cs(styles.goodPractices, className)}>
            <div className={styles.mainContent}>
                <section className={styles.profile}>
                    <Header
                        headingSize="extraLarge"
                        heading="Global Repositories for Good Practices"
                    />
                    <div className={styles.content}>
                        <EllipsizedContent>
                            <HTMLOutput
                                value={goodPracticeMeta.description}
                            />
                        </EllipsizedContent>
                        <div>
                            <div>
                                {goodPracticeMeta.totalCount}
                            </div>
                            <div>
                                Good Practices
                            </div>
                        </div>
                    </div>
                    <Button
                        name={undefined}
                    >
                        Find Good Practices
                    </Button>
                </section>
                <section className={styles.map}>
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
                        <MapContainer className={styles.mapContainer} />
                        <MapSource
                            sourceKey="multi-points"
                            sourceOptions={sourceOption}
                            geoJson={goodPracticesGeoJson}
                        >
                            <MapLayer
                                layerKey="points-halo-circle"
                                layerOptions={{
                                    type: 'circle',
                                    paint: orangePointHaloCirclePaint,
                                }}
                            />
                        </MapSource>
                    </Map>
                    <div>
                        <div>
                            <p>
                                Do you have a Good Practice you would like us to review?
                            </p>
                            <Button
                                name={undefined}
                            >
                                Submit a Good Practice
                            </Button>
                        </div>
                        <div>
                            <p>
                                For more information please contact:
                            </p>
                            <div>
                                <a
                                    href={`mailto:${goodPracticeMeta.contactEmail}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Email
                                </a>
                                /
                                <a
                                    href={goodPracticeMeta.contactFormLink}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Online Form
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                <section className={styles.faqSection}>
                    {goodPracticeMeta.faqs.map((faq, i) => (
                        <CollapsibleContent
                            key={faq.id}
                            name={faq.id}
                            onExpansionChange={handleFaqExpansionChange}
                            isExpanded={expandedFaq === faq.id}
                            header={`Q${i + 1}: ${faq.title}`}
                        >
                            {faq.description || '-'}
                        </CollapsibleContent>
                    ))}
                </section>
                <section className={styles.filters}>
                    <Header
                        headingSize="large"
                        heading="Filter or search the Good Practices"
                    />
                    <div>
                        Filter or search for the Good Practices using the options below.
                    </div>
                    <div className={styles.inputs}>
                        <SelectInput
                            variant="general"
                            placeholder="Type of Good Practice"
                            name="typeOfGoodPractice"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Drivers of Displacement"
                            name="driversOfDisplacement"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Focus Area"
                            name="focusArea"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="State"
                            name="stage"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Region"
                            name="region"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                        <SelectInput
                            variant="general"
                            placeholder="Country"
                            name="country"
                            value={undefined}
                            options={options}
                            keySelector={(item) => item.key}
                            labelSelector={(item) => item.label}
                            onChange={() => undefined}
                        />
                    </div>
                    <div className={styles.searchContainer}>
                        <TextInput
                            variant="general"
                            value={undefined}
                            placeholder="Search for Best Practice"
                            name="search"
                            onChange={() => undefined}
                            icons={(
                                <IoSearch />
                            )}
                        />
                    </div>
                </section>
                <section>
                    -
                </section>
            </div>
        </div>
    );
}

export default GlobalRepositories;

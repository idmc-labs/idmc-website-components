import React from 'react';
import {
    Tab,
    Tabs,
    TabList,
    TabPanel,
    NumberOutput,
    SelectInput,
} from '@the-deep/deep-ui';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import {
    IoMapOutline,
    IoListCircleOutline,
} from 'react-icons/io5';
import { _cs, formattedNormalize, Lang } from '@togglecorp/fujs';
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

import Button from '#components/Button';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';

import { countryMetadata, countryOverviews, statistics, iduGeojson, idus } from './data';
import styles from './styles.css';

const options: { key: string; label: string }[] = [];

const orangePointHaloCirclePaint: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-color': {
        property: 'type',
        type: 'categorical',
        stops: [
            ['Conflict', 'rgb(239, 125, 0)'],
            ['Disaster', 'rgb(1, 142, 202)'],
            ['Other', 'rgb(51, 149, 62)'],
        ],
    },
    'circle-radius': {
        property: 'value', // geojson property based on which you want too change the color
        base: 1.75,
        stops: [
            [0, 5],
            [100, 9],
            [1000, 13],
        ],
    },
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const lightStyle = 'mapbox://styles/mapbox/light-v10';

const colorScheme = [
    '#06169e',
    '#0738c8',
    '#0774e1',
    '#018ec9',
    '#2cb7e1',
    '#5ed9ed',
];

// NOTE: No types defined by Recharts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBar(props: any) {
    const {
        fill,
        x,
        y,
        width,
        height,
    } = props;

    return (
        <rect
            x={x}
            y={y}
            rx={width / 2}
            width={width}
            height={height}
            stroke="none"
            fill={fill}
        />
    );
}

function formatNumber(value: number) {
    const {
        number,
        normalizeSuffix = '',
    } = formattedNormalize(value, Lang.en);

    return `${number.toPrecision(3)} ${normalizeSuffix}`;
}

interface InfoGraphicProps {
    totalValue: number;
    description: React.ReactNode;
    date: React.ReactNode;
    chart: React.ReactNode;
}

function Infographic(props: InfoGraphicProps) {
    const {
        totalValue,
        description,
        date,
        chart,
    } = props;

    return (
        <div className={styles.infographic}>
            <div>
                <NumberOutput
                    className={styles.totalValue}
                    value={totalValue}
                    precision={1}
                    normal
                />
                <div className={styles.description}>
                    {description}
                </div>
                <div className={styles.date}>
                    {date}
                </div>
            </div>
            <div className={styles.chart}>
                {chart}
            </div>
        </div>
    );
}

interface Props {
    className?: string;
}

function CountryProfile(props: Props) {
    const {
        className,
    } = props;

    const [moreIduShown, setMoreIduShown] = React.useState(false);

    const [activeYear, setActiveYear] = React.useState<string | undefined>(
        countryOverviews[0]?.year,
    );

    return (
        <div className={_cs(styles.countryProfile, className)}>
            <div className={styles.mainContent}>
                <section className={styles.profile}>
                    <Header
                        headingSize="extraLarge"
                        heading="Country Profile"
                    />
                    <EllipsizedContent>
                        <HTMLOutput
                            value={countryMetadata.description}
                        />
                    </EllipsizedContent>
                </section>
                {countryOverviews && countryOverviews.length > 0 && (
                    <section className={styles.overview}>
                        <Header
                            headingSize="large"
                            heading="Overview"
                        />
                        <Tabs
                            value={activeYear}
                            onChange={setActiveYear}
                        >
                            <TabList>
                                {countryOverviews.map((countryOverview) => (
                                    <Tab
                                        key={countryOverview.year}
                                        name={countryOverview.year}
                                        className={styles.tab}
                                    >
                                        {countryOverview.year}
                                    </Tab>
                                ))}
                            </TabList>
                            {countryOverviews.map((countryOverview) => (
                                <TabPanel
                                    key={countryOverview.year}
                                    name={countryOverview.year}
                                >
                                    <div>
                                        Last modified:
                                        {countryOverview.lastModified}
                                    </div>
                                    <EllipsizedContent>
                                        <HTMLOutput
                                            value={countryOverview.description}
                                        />
                                    </EllipsizedContent>
                                </TabPanel>
                            ))}
                        </Tabs>
                    </section>
                )}
                {(
                    statistics.conflict
                    || statistics.disaster
                    || countryMetadata.displacementData
                ) && (
                    <section className={styles.displacementData}>
                        <Header
                            headingSize="large"
                            heading="Displacement Data"
                        />
                        <EllipsizedContent>
                            <HTMLOutput
                                value={countryMetadata.displacementData}
                            />
                        </EllipsizedContent>
                        <div className={styles.infographics}>
                            {statistics.conflict && (
                                <div className={styles.conflictInfographics}>
                                    <Header
                                        heading="Conflict and Violence Data"
                                        headingSize="medium"
                                    />
                                    <div className={styles.conflictFilter}>
                                        <SelectInput
                                            label="Timescale"
                                            name="timescale"
                                            value={undefined}
                                            options={options}
                                            keySelector={(item) => item.key}
                                            labelSelector={(item) => item.label}
                                            onChange={() => undefined}
                                        />
                                    </div>
                                    <div className={styles.infographicList}>
                                        <Infographic
                                            totalValue={statistics.conflict.newDisplacements}
                                            description={statistics.conflict.newDisplacementsLabel}
                                            date={`${statistics.startYear} - ${statistics.endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <BarChart
                                                        className={styles.chart}
                                                        data={statistics.conflict.timeseries}
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
                                                            dataKey="total"
                                                            fill="var(--color-conflict)"
                                                            name="Conflict new displacements"
                                                            shape={<CustomBar />}
                                                            maxBarSize={10}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                        <Infographic
                                            totalValue={statistics.conflict.noOfIdps}
                                            description={statistics.conflict.noOfIdpsLabel}
                                            date={`As of end of ${statistics.endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <LineChart
                                                        className={styles.chart}
                                                        data={statistics.conflict.timeseries}
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
                                                            dataKey="totalStock"
                                                            name="Conflict total number of IDPs"
                                                            key="totalStock"
                                                            stroke="var(--color-conflict)"
                                                            strokeWidth={2}
                                                            connectNulls
                                                            dot
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                            {statistics.disaster && (
                                <div className={styles.disasterInfographics}>
                                    <Header
                                        headingSize="medium"
                                        heading="Disaster Data"
                                    />
                                    <div className={styles.disasterFilter}>
                                        <SelectInput
                                            label="Timescale"
                                            name="timescale"
                                            value={undefined}
                                            options={options}
                                            keySelector={(item) => item.key}
                                            labelSelector={(item) => item.label}
                                            onChange={() => undefined}
                                        />
                                        <SelectInput
                                            label="Disaster Category"
                                            name="disasterCategory"
                                            value={undefined}
                                            options={options}
                                            keySelector={(item) => item.key}
                                            labelSelector={(item) => item.label}
                                            onChange={() => undefined}
                                        />
                                    </div>
                                    <div className={styles.infographicList}>
                                        <Infographic
                                            totalValue={statistics.disaster.newDisplacements}
                                            description={statistics.disaster.newDisplacementsLabel}
                                            date={`${statistics.startYear} - ${statistics.endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <BarChart
                                                        data={statistics.disaster.timeseries}
                                                        className={styles.chart}
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
                                                            dataKey="total"
                                                            fill="var(--color-disaster)"
                                                            name="Disaster new displacements"
                                                            shape={<CustomBar />}
                                                            maxBarSize={10}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                        <Infographic
                                            totalValue={statistics.disaster.noOfEvents}
                                            description={statistics.disaster.noOfEventsLabel}
                                            date={`${statistics.startYear} - ${statistics.endYear}`}
                                            chart={(
                                                <ResponsiveContainer>
                                                    <PieChart className={styles.chart}>
                                                        <Tooltip
                                                            formatter={formatNumber}
                                                        />
                                                        <Legend />
                                                        <Pie
                                                            data={statistics.disaster.categories}
                                                            dataKey="total"
                                                            nameKey="label"
                                                        >
                                                            {statistics.disaster.categories.map(({ label }, index) => ( // eslint-disable-line max-len
                                                                <Cell
                                                                    key={label}
                                                                    fill={colorScheme[
                                                                        index % colorScheme.length
                                                                    ]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
                <section className={styles.latestNewDisplacements}>
                    <Header
                        headingSize="large"
                        heading="Latest New Displacements"
                    />
                    <EllipsizedContent>
                        <HTMLOutput
                            value={countryMetadata.latestNewDisplacements}
                        />
                    </EllipsizedContent>
                    <div className={styles.iduContainer}>
                        {(moreIduShown ? idus : idus.slice(0, 4)).map((idu) => (
                            <div
                                key={idu.id}
                                className={styles.idu}
                            >
                                <HTMLOutput
                                    value={idu.standard_popup_text}
                                />
                            </div>
                        ))}
                    </div>
                    {idus.length > 4 && (
                        <Button
                            name={undefined}
                            // variant="secondary"
                            onClick={() => {
                                setMoreIduShown((val) => !val);
                            }}
                        >
                            {moreIduShown ? 'Collapse' : 'Show more'}
                        </Button>
                    )}
                </section>
                <section className={styles.internalDisplacementUpdates}>
                    <Header
                        headingSize="large"
                        heading="Internal Displacement Updates"
                    />
                    <EllipsizedContent>
                        <HTMLOutput
                            value={countryMetadata.internalDisplacementUpdates}
                        />
                    </EllipsizedContent>
                    <div className={styles.iduFilter}>
                        <div className={styles.filter}>
                            <SelectInput
                                label="Timescale"
                                name="timescale"
                                value={undefined}
                                options={options}
                                keySelector={(item) => item.key}
                                labelSelector={(item) => item.label}
                                onChange={() => undefined}
                            />
                            <SelectInput
                                label="Type of displacement"
                                name="typeOfDisplacement"
                                value={undefined}
                                options={options}
                                keySelector={(item) => item.key}
                                labelSelector={(item) => item.label}
                                onChange={() => undefined}
                            />
                            <SelectInput
                                label="No. of displacement"
                                name="numberOfDisplacement"
                                value={undefined}
                                options={options}
                                keySelector={(item) => item.key}
                                labelSelector={(item) => item.label}
                                onChange={() => undefined}
                            />
                        </div>
                        <div className={styles.segmentInput}>
                            <IoMapOutline />
                            <IoListCircleOutline />
                        </div>
                    </div>
                    Hover over and click on the coloured bubbles to see near real-time
                    snapshots of situations of internal displacement across the globe.
                    <Map
                        mapStyle={lightStyle}
                        mapOptions={{
                            logoPosition: 'bottom-left',
                            scrollZoom: false,
                        }}
                        scaleControlShown
                        navControlShown
                    >
                        <div className={styles.mapWrapper}>
                            <MapContainer
                                className={styles.mapContainer}
                            />
                            <div className={styles.legend}>
                                Legend goes here!
                            </div>
                        </div>
                        <MapBounds
                            bounds={statistics.bounds}
                            padding={50}
                        />
                        <MapSource
                            sourceKey="multi-points"
                            sourceOptions={sourceOption}
                            geoJson={iduGeojson}
                        >
                            <MapLayer
                                layerKey="points-halo-circle"
                                // onClick={handlePointClick}
                                layerOptions={{
                                    type: 'circle',
                                    paint: orangePointHaloCirclePaint,
                                }}
                            />
                        </MapSource>
                    </Map>
                </section>
            </div>
        </div>
    );
}

export default CountryProfile;

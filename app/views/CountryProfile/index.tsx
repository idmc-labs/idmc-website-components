import React from 'react';
import {
    Header,
    Tab,
    Tabs,
    TabList,
    TabPanel,
    NumberOutput,
} from '@the-deep/deep-ui';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import { IoBarChart } from 'react-icons/io5';
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

import TextInput from '#components/TextInput';
import RawButton from '#components/RawButton';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';

import { countryMetadata, countryOverviews, statistics, iduGeojson } from './data';
import styles from './styles.css';

const orangePointHaloCirclePaint: mapboxgl.CirclePaint = {
    'circle-opacity': 0.6,
    'circle-color': {
        property: 'type',
        type: 'categorical',
        stops: [
            ['Conflict', 'orange'],
            ['Disaster', 'blue'],
            ['Other', 'green'],
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

    const [activeYear, setActiveYear] = React.useState<string | undefined>(
        countryOverviews[0]?.year,
    );

    return (
        <div className={_cs(styles.countryProfile, className)}>
            <TextInput
                name={undefined}
                value={undefined}
                actions="SEARCH"
            />
            <RawButton
                name={undefined}
            />
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
                            headingSize="medium"
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
                                    <HTMLOutput
                                        value={countryOverview.description}
                                    />
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
                            headingSize="medium"
                            heading="Displacement Data"
                        />
                        <HTMLOutput
                            value={countryMetadata.displacementData}
                        />
                        <div className={styles.infographics}>
                            {statistics.conflict && (
                                <div className={styles.conflictInfographics}>
                                    <Header
                                        heading="Conflict and Violence Data"
                                    />
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
                                                            fill="orange"
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
                                                            stroke="orange"
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
                                        heading="Disaster Data"
                                    />
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
                                                            fill="blue"
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
                        headingSize="extraLarge"
                        heading="Latest New Displacements"
                    />
                    <HTMLOutput
                        value={countryMetadata.latestNewDisplacements}
                    />
                </section>
                <section className={styles.internalDisplacementUpdates}>
                    <Header
                        headingSize="extraLarge"
                        heading="Internal Displacement Updates"
                    />
                    <EllipsizedContent>
                        <HTMLOutput
                            value={countryMetadata.internalDisplacementUpdates}
                        />
                    </EllipsizedContent>
                    <Map
                        mapStyle={lightStyle}
                        mapOptions={{
                            logoPosition: 'bottom-left',
                            scrollZoom: false,
                        }}
                        scaleControlShown
                        navControlShown
                    >
                        <MapContainer className={styles.mapContainer} />
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

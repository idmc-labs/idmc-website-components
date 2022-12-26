import React, {
    useState,
    useCallback,
    useMemo,
} from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    LngLatBounds,
} from 'mapbox-gl';
import {
    IoDownloadOutline,
    IoExitOutline,
} from 'react-icons/io5';
import {
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import { saveAs } from 'file-saver';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import stringify from 'csv-stringify/lib/browser/sync';

import {
    IduDataQuery,
    IduDataQueryVariables,
} from '#generated/types';

import Button from '#components/Button';
import ButtonLikeLink from '#components/ButtonLikeLink';
import Header from '#components/Header';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';

import { monthList } from '#utils/common';
import LegendElement from '#components/LegendElement';

import RawIduMap from './RawIduMap';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import useInputState from '../../hooks/useInputState';

import styles from './styles.css';

// FIXME: move this somewhere else
const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';
function suffixDrupalEndpoing(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}
const giddLink = suffixDrupalEndpoing('/database/displacement-data');

const IDU_DATA = gql`
    query IduData {
        idu @rest(
            type: "[IduData]",
            method: "GET",
            endpoint: "helix",
            path: "/external-api/idus?client_id=IDMCWSHSOLO009"
        ) {
            id
            country
            iso3
            centroid
            latitude
            longitude
            displacement_type
            qualifier
            figure
            displacement_date
            displacement_start_date
            displacement_end_date
            year
            event_name
            event_start_date
            event_end_date
            category
            subcategory
            type
            subtype
            standard_popup_text
            standard_info_text
        }
    }
`;

type DisplacementType = 'Conflict' | 'Disaster' | 'Other';
type DisplacementNumber = 'less-than-100' | 'less-than-1000' | 'more-than-1000';

const START_YEAR = 2008;
const today = new Date();
const END_YEAR_FOR_IDU = today.getFullYear();

// countryInfo?.boundingBox as LngLatBounds | undefined

function useIduQuery(
    boundingBox?: LngLatBounds | undefined,
    iso3?: string,
) {
    const [mapTimeRangeActual, setMapTimeRange] = useState<[number, number]>(
        [START_YEAR, END_YEAR_FOR_IDU],
    );

    const [mapTimeMonthRange, setMapTimeMonthRange] = useState<[number, number]>(
        [0, 12],
    );
    const mapTimeRange = useDebouncedValue(mapTimeRangeActual);
    const [
        mapTypeOfDisplacements,
        setMapTypeOfDisplacements,
    ] = useInputState<DisplacementType[]>(['Conflict', 'Disaster']);
    const [
        mapNoOfDisplacements,
        setMapNoOfDisplacements,
    ] = useInputState<DisplacementNumber[]>(['less-than-100', 'less-than-1000', 'more-than-1000']);

    const {
        previousData: previousIduData,
        data: iduData = previousIduData,
        // FIXME: handle loading and error
        // loading: iduDataLoading,
        // error: iduDataError,
    } = useQuery<IduDataQuery, IduDataQueryVariables>(
        IDU_DATA,
        {
            onCompleted: (response) => {
                if (!response.idu || response.idu.length <= 0) {
                    return;
                }
                const max = Math.max(...response.idu.map((item) => item.year).filter(isDefined));
                setMapTimeRange([max, Math.max(max, END_YEAR_FOR_IDU)]);
            },
        },
    );

    const idus = React.useMemo(() => (
        iso3
            ? iduData?.idu.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    const [iduFilterStartDate, iduFilterEndDate] = useMemo(
        () => {
            const lastYearToday = new Date(today);
            lastYearToday.setMonth(lastYearToday.getMonth() - 12);

            const filterStartDate = new Date(
                lastYearToday.getFullYear(),
                lastYearToday.getMonth(),
                1,
            );
            filterStartDate.setMonth(filterStartDate.getMonth() + mapTimeMonthRange[0]);

            const filterEndDate = new Date(
                lastYearToday.getFullYear(),
                lastYearToday.getMonth(),
                1,
            );
            filterEndDate.setMonth(filterEndDate.getMonth() + 1 + mapTimeMonthRange[1]);
            filterEndDate.setSeconds(filterEndDate.getSeconds() - 1);

            return [filterStartDate, filterEndDate] as const;
        },
        [mapTimeMonthRange],
    );

    const idusForMap = React.useMemo(() => (
        idus?.filter((d) => {
            if (isNotDefined(d.displacement_date)) {
                return false;
            }

            const displacementDate = new Date(d.displacement_date);

            return displacementDate.getTime() >= iduFilterStartDate.getTime()
                && displacementDate.getTime() <= iduFilterEndDate.getTime();
        })
    ), [idus, iduFilterStartDate, iduFilterEndDate]);

    const handleTypeOfDisplacementsChange = useCallback((value: DisplacementType) => {
        setMapTypeOfDisplacements((oldValue: DisplacementType[]) => {
            const newValue = [...oldValue];
            const oldIndex = oldValue.findIndex((d) => d === value);
            if (oldIndex !== -1) {
                newValue.splice(oldIndex, 1);
            } else {
                newValue.push(value);
            }

            return newValue;
        });
    }, [setMapTypeOfDisplacements]);

    const handleNoOfDisplacementsChange = useCallback((value: DisplacementNumber) => {
        setMapNoOfDisplacements((oldValue: DisplacementNumber[]) => {
            const newValue = [...oldValue];
            const oldIndex = oldValue.findIndex((d) => d === value);
            if (oldIndex !== -1) {
                newValue.splice(oldIndex, 1);
            } else {
                newValue.push(value);
            }

            return newValue;
        });
    }, [setMapNoOfDisplacements]);

    const handleExportIduClick = React.useCallback(() => {
        // FIXME: we have duplicate logic for filtering for now
        const filteredIdus = idus?.map((idu) => {
            if (
                isNotDefined(idu.longitude)
                || isNotDefined(idu.latitude)
                || isNotDefined(idu.figure)
                || isNotDefined(idu.displacement_type)
                // NOTE: filtering out displacement_type Other
                || idu.displacement_type === 'Other'
            ) {
                return undefined;
            }

            if (!mapTypeOfDisplacements.includes(idu.displacement_type)) {
                return undefined;
            }

            let key: DisplacementNumber;
            if (idu.figure < 100) {
                key = 'less-than-100';
            } else if (idu.figure < 1000) {
                key = 'less-than-1000';
            } else {
                key = 'more-than-1000';
            }
            if (!mapNoOfDisplacements.includes(key)) {
                return undefined;
            }

            const [min, max] = mapTimeRange;
            if (!idu.year || idu.year < min || idu.year > max) {
                return undefined;
            }
            return idu;
        }).filter(isDefined);

        if (filteredIdus && filteredIdus.length > 0) {
            // FIXME: we may need to manually set headers (first data may not
            // always have all the keys)
            const headers = Object.keys(filteredIdus[0]);

            const dataString = stringify(filteredIdus, {
                columns: headers,
            });
            const fullCsvString = `${headers}\n${dataString}`;
            const blob = new Blob(
                [fullCsvString],
                { type: 'text/csv;charset=utf-8' },
            );
            saveAs(blob, 'idu_export.csv');
        }
    }, [idus, mapNoOfDisplacements, mapTypeOfDisplacements, mapTimeRange]);

    const widget = (
        <Container
            filtersClassName={styles.filtersContainer}
            filters={(
                <>
                    <div className={styles.timeRangeContainer}>
                        <SliderInput
                            hideValues
                            className={styles.timeRangeInput}
                            // min={mapTimeRangeBounds[0]}
                            // max={mapTimeRangeBounds[1]}
                            min={0}
                            max={12}
                            labelDescription={`${monthList[iduFilterStartDate.getMonth()]} ${iduFilterStartDate.getFullYear()} - ${monthList[iduFilterEndDate.getMonth()]} ${iduFilterEndDate.getFullYear()}`}
                            step={1}
                            minDistance={0}
                            value={mapTimeMonthRange}
                            onChange={setMapTimeMonthRange}
                        />
                    </div>
                    <div className={styles.displacementLegend}>
                        <Header
                            headingSize="extraSmall"
                            heading="Type of Displacement"
                        />
                        <div className={styles.legendElementList}>
                            <LegendElement
                                name="Conflict"
                                onClick={handleTypeOfDisplacementsChange}
                                isActive={mapTypeOfDisplacements.includes('Conflict')}
                                color="var(--color-conflict)"
                                label="Conflict"
                            />
                            <LegendElement
                                name="Disaster"
                                onClick={handleTypeOfDisplacementsChange}
                                isActive={mapTypeOfDisplacements.includes('Disaster')}
                                color="var(--color-disaster)"
                                label="Disaster"
                            />
                        </div>
                    </div>
                    <div className={styles.numberLegend}>
                        <Header
                            headingSize="extraSmall"
                            heading="No. of Displacement"
                        />
                        <div className={styles.legendElementList}>
                            <LegendElement
                                name="less-than-100"
                                onClick={handleNoOfDisplacementsChange}
                                isActive={mapNoOfDisplacements.includes('less-than-100')}
                                color="grey"
                                size={10}
                                label="< 100"
                            />
                            <LegendElement
                                name="less-than-1000"
                                onClick={handleNoOfDisplacementsChange}
                                isActive={mapNoOfDisplacements.includes('less-than-1000')}
                                color="grey"
                                size={18}
                                label="100 - 1000"
                            />
                            <LegendElement
                                name="more-than-1000"
                                onClick={handleNoOfDisplacementsChange}
                                isActive={mapNoOfDisplacements.includes('more-than-1000')}
                                color="grey"
                                size={26}
                                label="> 1000"
                            />
                        </div>
                    </div>
                </>
            )}
            footerActions={(
                <>
                    <Button
                        name={undefined}
                        onClick={handleExportIduClick}
                        className={styles.disasterButton}
                        icons={(
                            <IoDownloadOutline />
                        )}
                    >
                        Download Displacement Data
                    </Button>
                    <ButtonLikeLink
                        href={giddLink}
                        target="_blank"
                        className={styles.disasterButton}
                        rel="noopener noreferrer"
                        icons={(
                            <IoExitOutline />
                        )}
                    >
                        View Full Database
                    </ButtonLikeLink>
                </>
            )}
        >
            <RawIduMap
                idus={idusForMap}
                boundingBox={boundingBox}
                mapTypeOfDisplacements={mapTypeOfDisplacements}
                mapNoOfDisplacements={mapNoOfDisplacements}
                mapTimeRange={mapTimeRange}
            />
        </Container>
    );

    return {
        idus,
        widget,
    };
}

export default useIduQuery;

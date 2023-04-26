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
    IoExitOutline,
} from 'react-icons/io5';
import {
    isNotDefined,
} from '@togglecorp/fujs';

import {
    IduDataQuery,
    IduDataQueryVariables,
} from '#generated/types';

import ButtonLikeLink from '#components/ButtonLikeLink';
import Header from '#components/Header';
import SliderInput from '#components/SliderInput';
import Container from '#components/Container';

import { monthList } from '#utils/common';
import LegendElement from '#components/LegendElement';

import RawIduMap from './RawIduMap';
import useInputState from '../../hooks/useInputState';

import styles from './styles.css';

const HELIX_CLIENT_ID = process.env.REACT_APP_HELIX_CLIENT_ID as string || '';

// FIXME: move this somewhere else
const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';
function suffixDrupalEndpoint(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}
const giddLink = suffixDrupalEndpoint('/database/displacement-data');

const IDU_DATA = gql`
    query IduData($clientId: String!) {
        idu(clientId: $clientId) @rest(
            type: "[IduData]",
            method: "GET",
            endpoint: "helix",
            path: "/idus?client_id={args.clientId}"
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

// const START_YEAR = 2008;
const TODAY = new Date();
const MONTHS = 6;

function useIduQuery(
    boundingBox?: LngLatBounds | undefined,
    iso3?: string,
) {
    const [mapTimeMonthRange, setMapTimeMonthRange] = useState<[number, number]>(
        [MONTHS - 1, MONTHS],
    );

    const [iduFilterStartDate, iduFilterEndDate] = useMemo(
        () => {
            const lastYearToday = new Date(TODAY);
            lastYearToday.setMonth(lastYearToday.getMonth() - MONTHS);

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
            variables: {
                clientId: HELIX_CLIENT_ID,
            },
        },
    );

    const idus = React.useMemo(() => (
        iso3
            ? iduData?.idu.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    const idusForMap = React.useMemo(() => (
        idus?.filter((d) => {
            if (isNotDefined(d.displacement_date)) {
                return false;
            }

            if (d.displacement_type && !mapTypeOfDisplacements.includes(d.displacement_type)) {
                return false;
            }

            let key: DisplacementNumber;
            if (d.figure < 100) {
                key = 'less-than-100';
            } else if (d.figure < 1000) {
                key = 'less-than-1000';
            } else {
                key = 'more-than-1000';
            }
            if (!mapNoOfDisplacements.includes(key)) {
                return false;
            }

            const displacementDate = new Date(d.displacement_date);

            return displacementDate.getTime() >= iduFilterStartDate.getTime()
                && displacementDate.getTime() <= iduFilterEndDate.getTime();
        })
    ), [idus, iduFilterStartDate, iduFilterEndDate, mapNoOfDisplacements, mapTypeOfDisplacements]);

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

    const widget = (
        <Container
            filtersClassName={styles.filtersContainer}
            filters={(
                <>
                    <div className={styles.timeRangeContainer}>
                        <SliderInput
                            label="Timescale"
                            hideValues
                            className={styles.timeRangeInput}
                            min={0}
                            max={MONTHS}
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
                <ButtonLikeLink
                    href={giddLink}
                    className={styles.disasterButton}
                    icons={(
                        <IoExitOutline />
                    )}
                >
                    Go to our Data Centre (GIDD)
                </ButtonLikeLink>
            )}
        >
            <RawIduMap
                idus={idusForMap}
                boundingBox={boundingBox}
            />
        </Container>
    );

    return {
        idus,
        widget,
    };
}

export default useIduQuery;

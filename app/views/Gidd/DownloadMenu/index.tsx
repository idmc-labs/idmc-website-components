import React from 'react';
import { PopupButton } from '@togglecorp/toggle-ui';
import { IoInformationCircleOutline } from 'react-icons/io5';

import ButtonLikeLink from '#components/ButtonLikeLink';
import {
    suffixHelixRestEndpoint,
    prepareUrl,
} from '#utils/common';

import styles from './styles.css';

type Cause = 'conflict' | 'disaster';

export interface Props {
    cause: Cause | undefined;
    countriesIso3: string[];
    hazardTypes: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    disaggregationAvailable: boolean;
}

function DownloadMenu(props: Props) {
    const {
        cause,
        countriesIso3,
        hazardTypes,
        startYear,
        endYear,
        clientCode,
        disaggregationAvailable,
    } = props;

    return (
        <PopupButton
            popupClassName={styles.popup}
            label="Download dataset"
            name="download"
            variant="primary"
            persistent={false}
            compact
        >
            {cause !== 'disaster' && cause !== 'conflict' && (
                <>
                    <ButtonLikeLink
                        transparent
                        compact
                        actions={(
                            <IoInformationCircleOutline
                                title="Annual updates of internal displacement data by country"
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/displacements/displacement-export/',
                            {
                                iso3__in: countriesIso3,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Annual displacement data (.xlsx)
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        transparent
                        compact
                        disabled={!disaggregationAvailable}
                        actions={(
                            <IoInformationCircleOutline
                                title={disaggregationAvailable
                                    ? `${endYear} Disaggregated caseloads`
                                    : undefined}
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disaggregations/disaggregation-export/',
                            {
                                iso3__in: countriesIso3,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Disaggregated data ${endYear} (.xlsx)`}
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        transparent
                        compact
                        disabled={!disaggregationAvailable}
                        actions={(
                            <IoInformationCircleOutline
                                title={disaggregationAvailable
                                    ? `${endYear} Disaggregated caseloads (geojson) formatted for GIS applications.\nIMPORTANT: Please read the metadata in the geojson`
                                    : undefined}
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disaggregations/disaggregation-geojson/',
                            {
                                iso3__in: countriesIso3,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Disaggregated data ${endYear} (.geojson)`}
                    </ButtonLikeLink>
                </>
            )}
            {cause === 'conflict' && (
                <>
                    <ButtonLikeLink
                        transparent
                        compact
                        actions={(
                            <IoInformationCircleOutline
                                title="Annual updates of internal displacement data related to conflict"
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/displacements/displacement-export/',
                            {
                                cause,
                                iso3__in: countriesIso3,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Conflict annual aggregated data (.xlsx)
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        transparent
                        compact
                        disabled={!disaggregationAvailable}
                        actions={(
                            <IoInformationCircleOutline
                                title={disaggregationAvailable
                                    ? `${endYear} Conflict disaggregated caseloads`
                                    : undefined}
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disaggregations/disaggregation-export/',
                            {
                                cause,
                                iso3__in: countriesIso3,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Conflict disaggregated data ${endYear} (.xlsx)`}
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        transparent
                        compact
                        disabled={!disaggregationAvailable}
                        actions={(
                            <IoInformationCircleOutline
                                title={disaggregationAvailable
                                    ? `${endYear} Conflict disaggregated caseloads (geojson) formatted for GIS applications.\nIMPORTANT: Please read the metadata in the geojson`
                                    : undefined}
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disaggregations/disaggregation-geojson/',
                            {
                                cause,
                                iso3__in: countriesIso3,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Conflict disaggregated data ${endYear} (.geojson)`}
                    </ButtonLikeLink>
                </>
            )}
            {cause === 'disaster' && (
                <>
                    <ButtonLikeLink
                        transparent
                        compact
                        actions={(
                            <IoInformationCircleOutline
                                title="Annual updates of internal displacement data related to disasters"
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disasters/disaster-export/',
                            {
                                iso3__in: countriesIso3,
                                hazard_type__in: hazardTypes,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Disaster events aggregated data (.xlsx)
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        transparent
                        compact
                        disabled={!disaggregationAvailable}
                        actions={(
                            <IoInformationCircleOutline
                                title={disaggregationAvailable
                                    ? `${endYear} Disaster disaggregated caseloads`
                                    : undefined}
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disaggregations/disaggregation-export/',
                            {
                                cause,
                                iso3__in: countriesIso3,
                                disaster_type__in: hazardTypes,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Disaster events disaggregated data ${endYear} (.xlsx)`}
                    </ButtonLikeLink>
                    <ButtonLikeLink
                        transparent
                        compact
                        disabled={!disaggregationAvailable}
                        actions={(
                            <IoInformationCircleOutline
                                title={disaggregationAvailable
                                    ? `${endYear} Disaster events disaggregated caseloads (geojson) formatted for GIS applications.\nIMPORTANT: Please read the metadata in the geojson`
                                    : undefined}
                            />
                        )}
                        href={suffixHelixRestEndpoint(prepareUrl(
                            'gidd/disaggregations/disaggregation-geojson/',
                            {
                                cause,
                                iso3__in: countriesIso3,
                                disaster_type__in: hazardTypes,
                                start_year: startYear,
                                end_year: endYear,
                            },
                        ), clientCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Disaster events disaggregated data ${endYear} (.geojson)`}
                    </ButtonLikeLink>
                </>
            )}
            {!disaggregationAvailable && (
                <p className={styles.exportMessage}>
                    Note: Disaggregated data can only be downloaded one
                    year at a time.
                </p>
            )}
        </PopupButton>
    );
}

export default DownloadMenu;

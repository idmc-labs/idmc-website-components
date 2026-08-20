import React from 'react';

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

    let annualHref: string;
    let annualTitle: string;
    if (cause === 'conflict') {
        annualHref = suffixHelixRestEndpoint(prepareUrl(
            'gidd/displacements/displacement-export/',
            { cause, iso3__in: countriesIso3, start_year: startYear, end_year: endYear },
        ), clientCode);
        annualTitle = 'Annual updates of internal displacement data related to conflict';
    } else if (cause === 'disaster') {
        annualHref = suffixHelixRestEndpoint(prepareUrl(
            'gidd/disasters/disaster-export/',
            {
                iso3__in: countriesIso3,
                hazard_type__in: hazardTypes,
                start_year: startYear,
                end_year: endYear,
            },
        ), clientCode);
        annualTitle = 'Annual updates of internal displacement data related to disasters';
    } else {
        annualHref = suffixHelixRestEndpoint(prepareUrl(
            'gidd/displacements/displacement-export/',
            { iso3__in: countriesIso3, start_year: startYear, end_year: endYear },
        ), clientCode);
        annualTitle = 'Annual updates of internal displacement data by country';
    }

    const disaggregationParams = cause === 'disaster'
        ? {
            cause,
            iso3__in: countriesIso3,
            disaster_type__in: hazardTypes,
            start_year: startYear,
            end_year: endYear,
        }
        : {
            cause,
            iso3__in: countriesIso3,
            start_year: startYear,
            end_year: endYear,
        };
    const xlsxHref = suffixHelixRestEndpoint(prepareUrl(
        'gidd/disaggregations/disaggregation-export/',
        disaggregationParams,
    ), clientCode);
    const geojsonHref = suffixHelixRestEndpoint(prepareUrl(
        'gidd/disaggregations/disaggregation-geojson/',
        disaggregationParams,
    ), clientCode);

    let causeLabel = '';
    if (cause === 'conflict') {
        causeLabel = 'Conflict ';
    } else if (cause === 'disaster') {
        causeLabel = 'Disaster ';
    }
    const xlsxTitle = disaggregationAvailable
        ? `${endYear} ${causeLabel}disaggregated caseloads`
        : undefined;
    const geojsonTitle = disaggregationAvailable
        ? `${endYear} ${causeLabel}disaggregated caseloads (geojson) formatted for GIS applications.\nIMPORTANT: Please read the metadata in the geojson`
        : undefined;

    return (
        <div className={styles.downloadGroups}>
            <div className={styles.downloadGroupRow}>
                <span className={styles.downloadGroupLabel}>
                    {`Disaggregated data for ${endYear}`}
                </span>
                <ButtonLikeLink
                    className={styles.downloadButton}
                    disabled={!disaggregationAvailable}
                    title={geojsonTitle}
                    href={geojsonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GeoJSON
                </ButtonLikeLink>
                <ButtonLikeLink
                    className={styles.downloadButton}
                    disabled={!disaggregationAvailable}
                    title={xlsxTitle}
                    href={xlsxHref}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Excel
                </ButtonLikeLink>
            </div>
            {!disaggregationAvailable && (
                <p className={styles.exportMessage}>
                    Note: Disaggregated data can only be downloaded one
                    year at a time.
                </p>
            )}
            <div className={styles.downloadGroupRow}>
                <ButtonLikeLink
                    className={styles.downloadButton}
                    title={annualTitle}
                    href={annualHref}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Annual displacement data
                </ButtonLikeLink>
            </div>
        </div>
    );
}

export default DownloadMenu;

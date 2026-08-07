import { memo } from 'react';
import {
    isFalsy,
    isNotDefined,
    isDefined,
    isFalsyString,
    listToMap,
    sum,
    caseInsensitiveSubmatch,
    compareStringSearch,
} from '@togglecorp/fujs';
import {
    formatNumberRaw,
    getAutoPrecision,
} from '#components/Numeral';
import { requireRuntimeConfig } from '#utils/runtimeConfig';

export const DRUPAL_REST_ENDPOINT = requireRuntimeConfig('REACT_APP_DRUPAL_REST_ENDPOINT', process.env.REACT_APP_DRUPAL_REST_ENDPOINT);
export const DRUPAL_ENDPOINT = requireRuntimeConfig('REACT_APP_DRUPAL_ENDPOINT', process.env.REACT_APP_DRUPAL_ENDPOINT);
export const HELIX_REST_ENDPOINT = requireRuntimeConfig('REACT_APP_HELIX_REST_ENDPOINT', process.env.REACT_APP_HELIX_REST_ENDPOINT);
export const HELIX_CLIENT_CODE = requireRuntimeConfig('REACT_APP_HELIX_CLIENT_ID', process.env.REACT_APP_HELIX_CLIENT_ID);
export const DATA_RELEASE = requireRuntimeConfig('REACT_APP_DATA_RELEASE', process.env.REACT_APP_DATA_RELEASE);

export const standaloneMode = (window as { standaloneMode?: boolean }).standaloneMode ?? false;

export function parseQueryString(value: string) {
    const val = value.substring(1);
    return listToMap(
        val.split('&').map((token) => token.split('=')),
        (item) => item[0],
        (item) => item[1],
    );
}

// NOTE: clientCode is sensitive and must not leak into analytics URLs
// (page_location / page_referrer). Strip it from a URL before sending to GA.
export function stripClientCode(rawUrl: string | undefined): string | undefined {
    if (isFalsyString(rawUrl)) {
        return undefined;
    }
    try {
        const url = new URL(rawUrl, window.location.origin);
        url.searchParams.delete('clientCode');
        return url.toString();
    } catch {
        return undefined;
    }
}

export function rankedSearchOnList<T>(
    list: T[],
    searchString: string | undefined,
    labelSelector: (item: T) => string,
) {
    if (isFalsyString(searchString)) {
        return list;
    }

    return list
        .filter((option) => caseInsensitiveSubmatch(labelSelector(option), searchString))
        .sort((a, b) => compareStringSearch(
            labelSelector(a),
            labelSelector(b),
            searchString,
        ));
}

export const genericMemo: (<T>(c: T) => T) = memo;

export const getHashFromBrowser = () => window.location.hash.substr(2);
export const setHashToBrowser = (hash: string | undefined) => {
    if (hash) {
        window.location.replace(`#/${hash}`);
    } else {
        window.location.hash = '';
    }
};

export function isValidNumber(value: unknown): value is number {
    if (isFalsy(value)) {
        return false;
    }

    if (Number.isNaN(+(value as number))) {
        return false;
    }

    if (value === null) {
        return false;
    }

    return true;
}

export function formatNumber(value: number) {
    const output = formatNumberRaw(
        value,
        ',',
        true,
        getAutoPrecision(value, 100, 2),
        0,
    );

    if (!output) {
        return '';
    }
    const {
        value: number,
        valueSuffix: normalizeSuffix = '',
    } = output;
    return `${number}${normalizeSuffix}`;
}

export function getCountryProfileLink(
    iso3: string,
    countryName: string | undefined,
    clientCode: string,
) {
    // NOTE: we need to also add countryName on standaloneMode url
    let link = standaloneMode
        ? `/?page=country-profile&iso3=${iso3}&clientCode=${clientCode}`
        : `/country-profiles/${iso3}`;
    if (countryName) {
        link = standaloneMode
            ? `${link}&countryName=${countryName}`
            : link;
    }
    return link;
}

export function getGoodPracticesLink() {
    return standaloneMode
        ? '/?page=good-practices'
        : '/good-practices';
}

export function getGoodPracticeLink(id: string) {
    return standaloneMode
        ? `/?page=good-practice&id=${id}`
        : `/good-practice?id=${id}`;
}

export function getIduLink(clientCode: string) {
    return standaloneMode
        ? `/?page=idu-map&clientCode=${clientCode}`
        : '/';
}

export function getConflictWidgetLink(iso3: string, clientCode: string) {
    const link = standaloneMode
        ? `/?page=conflict-widget&iso3=${iso3}&clientCode=${clientCode}`
        : '/';
    return link;
}

export function getDisasterWidgetLink(iso3: string, clientCode: string) {
    const link = standaloneMode
        ? `/?page=disaster-widget&iso3=${iso3}&clientCode=${clientCode}`
        : '/';
    return link;
}

export function getIduWidgetLink(iso3: string, clientCode: string) {
    // NOTE: we need to also add countryName on standaloneMode url
    const iduLink = standaloneMode
        ? `/?page=idu-widget&iso3=${iso3}&clientCode=${clientCode}`
        : '/';
    return iduLink;
}

export function getGiddLink(clientCode: string) {
    return standaloneMode
        ? `/?page=gidd&clientCode=${clientCode}`
        : '/';
}

export const monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const START_YEAR = 2008;

export function sumAndRemoveZero(args: (number | undefined)[]) {
    const newArgs = args.filter(isDefined);
    const total = sum(newArgs);
    return total === 0 ? undefined : total;
}

export function suffixDrupalEndpoint(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}

export function suffixHelixRestEndpoint(path: string, clientCode: string) {
    if (path.includes('?')) {
        return `${HELIX_REST_ENDPOINT}${path}&client_id=${clientCode}&release_environment=${DATA_RELEASE}`;
    }
    return `${HELIX_REST_ENDPOINT}${path}?client_id=${clientCode}&release_environment=${DATA_RELEASE}`;
}

export function readStorage(key: string) {
    const langValueFromStorage = localStorage.getItem(key);
    if (langValueFromStorage) {
        return JSON.parse(langValueFromStorage);
    }
    return undefined;
}

export function getHazardTypeLabel(hazardType: { id: string, label: string }) {
    if (hazardType.id === '2') {
        return `Dry ${hazardType.label}`;
    }
    if (hazardType.id === '11') {
        return `Wet ${hazardType.label}`;
    }
    return hazardType.label;
}

type Maybe<T> = T | null | undefined;

export interface UrlParams {
    [key: string]: Maybe<string | number | boolean | (string | number | boolean)[]>;
}
export function prepareUrl(url: string, params: UrlParams): string {
    const paramsString = Object.keys(params)
        .filter((k) => isDefined(params[k]))
        .map((k) => {
            const param = params[k];
            if (isNotDefined(param) || param === '' || (Array.isArray(param) && param.length === 0)) {
                return undefined;
            }
            let val: string;
            if (Array.isArray(param)) {
                val = [...param].sort().join(',');
            } else if (typeof param === 'number' || typeof param === 'boolean') {
                val = String(param);
            } else {
                val = param;
            }
            return `${encodeURIComponent(k)}=${encodeURIComponent(val)}`;
        })
        .filter(isDefined)
        .join('&');

    if (paramsString) {
        return `${url}?${paramsString}`;
    }
    return url;
}

export function getMaximum<T>(
    list: T[] | undefined,
    comparator: (item1: T, item2: T) => number,
): T | undefined {
    if (!list || list.length < 1) {
        return undefined;
    }
    return list.reduce((acc: T, item: T) => {
        if (!item) {
            return acc;
        }
        if (comparator(item, acc) > 0) {
            return item;
        }
        return acc;
    }, list[0]);
}

export function isDisaggregationAvailable(args: {
    filterStartYear: number,
    filterEndYear: number,
}) {
    const {
        filterStartYear,
        filterEndYear,
    } = args;
    return (
        filterStartYear === filterEndYear
        && filterStartYear >= 2023
    );
}

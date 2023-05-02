import { memo } from 'react';
import {
    isFalsy,
    isNotDefined,
    isDefined,
    isFalsyString,
    sum,
    caseInsensitiveSubmatch,
    compareStringSearch,
} from '@togglecorp/fujs';
import {
    formatNumberRaw,
    getAutoPrecision,
} from '#components/Numeral';

export const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';
export const HELIX_REST_ENDPOINT = process.env.REACT_APP_HELIX_REST_ENDPOINT as string;
export const HELIX_CLIENT_ID = process.env.REACT_APP_HELIX_CLIENT_ID as string || '';

export const standaloneMode = (window as { standaloneMode?: boolean }).standaloneMode ?? false;

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

export function getCountryProfileLink(iso3: string, countryName?: string) {
    // NOTE: we need to also add countryName on standaloneMode url
    let link = standaloneMode
        ? `/?page=country-profile&iso3=${iso3}`
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

export function getIduLink() {
    return standaloneMode
        ? '/?page=idu-map'
        : '/';
}

export function getConflictWidgetLink(iso3: string) {
    const link = standaloneMode
        ? `/?page=conflict-widget&iso3=${iso3}`
        : '/';
    return link;
}

export function getDisasterWidgetLink(iso3: string) {
    const link = standaloneMode
        ? `/?page=disaster-widget&iso3=${iso3}`
        : '/';
    return link;
}

export function getIduWidgetLink(iso3: string) {
    // NOTE: we need to also add countryName on standaloneMode url
    const iduLink = standaloneMode
        ? `/?page=idu-widget&iso3=${iso3}`
        : '/';
    return iduLink;
}

export function getGiddLink() {
    return standaloneMode
        ? '/?page=gidd'
        : '/';
}

export const monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const START_YEAR = 2008;
export const END_YEAR = 2021;

export function sumAndRemoveZero(args: (number | undefined)[]) {
    const newArgs = args.filter(isDefined);
    const total = sum(newArgs);
    return total === 0 ? undefined : total;
}

export function roundAndRemoveZero(data?: number) {
    if (isNotDefined(data) || data === 0) {
        return undefined;
    }
    const absoluteData = Math.abs(data);
    const sign = data > 0 ? 1 : -1;
    if (absoluteData <= 100) {
        return sign * absoluteData;
    }
    if (absoluteData <= 1000) {
        return sign * Math.round(absoluteData / 10) * 10;
    }
    if (absoluteData <= 10000) {
        return sign * Math.round(absoluteData / 100) * 100;
    }
    return sign * Math.round(data / 1000) * 1000;
}

export function suffixDrupalEndpoint(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}

export function replaceWithDrupalEndpoint(image: null): null;
export function replaceWithDrupalEndpoint(image: undefined): undefined;
export function replaceWithDrupalEndpoint(image: string): string;
export function replaceWithDrupalEndpoint(image: string | null | undefined): string | null | undefined;
export function replaceWithDrupalEndpoint(image: string | null | undefined) {
    if (!image || !DRUPAL_ENDPOINT) {
        return image;
    }
    const path = new URL(image).pathname;
    return suffixDrupalEndpoint(path);
}

export function suffixHelixRestEndpoint(path: string) {
    if (path.includes('?')) {
        return `${HELIX_REST_ENDPOINT}${path}&client_id=${HELIX_CLIENT_ID}`;
    }
    return `${HELIX_REST_ENDPOINT}${path}?cliend_id=${HELIX_CLIENT_ID}`;
}


export function readStorage(key: string) {
    const langValueFromStorage = localStorage.getItem(key);
    if (langValueFromStorage) {
        return JSON.parse(langValueFromStorage);
    }
    return undefined;
}

import { memo } from 'react';
import {
    isFalsy,
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

const standaloneMode = (window as { standaloneMode?: boolean }).standaloneMode ?? false;

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

export function add(args: (number | undefined)[]) {
    const newArgs = args.filter(isDefined);
    return sum(newArgs) === 0 ? undefined : sum(newArgs);
}

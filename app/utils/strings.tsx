import React from 'react';

import { formatNumberRaw, getAutoPrecision } from '#components/Numeral';
import { toLowerCaseKeepAbbr } from '#components/IduMap/EventListItem';

const splitRegex = /({[^{}]*})/g;

const testRegex = /^{([^{}]*)}$/;

type ParamsValue = React.ReactNode;

type ParamsForString = {
    [key: string]: ParamsValue;
};

function hasReactElement(lst: ParamsValue[]): boolean {
    return !!lst.find((p) => React.isValidElement(p));
}

function renderElement(r: { key: string; value: React.ReactNode }) {
    return (
        <span key={r.key}>
            {r.value}
        </span>
    );
}

export default function generateString(str: string, params: ParamsForString) {
    // TODO: Support escaping { and }
    // TODO: Support array param values

    const splits = str.split(splitRegex);
    const results = splits.map((split, index) => {
        const test = testRegex.exec(split);
        if (!test) {
            return {
                key: `${split}-${index}`,
                value: split,
            };
        }

        const key = test[1];
        return {
            key,
            value: params[key],
        };
    });

    const withReactElement = hasReactElement(Object.values(params).flat());
    const flattenedResults = results.flat();

    if (withReactElement) {
        return (
            <>
                {flattenedResults.map(renderElement)}
            </>
        );
    }
    return flattenedResults.map((r) => r.value).join('');
}

function pluralize(count: number, singular: string, plural: string) {
    return count === 1 ? singular : plural;
}

// Plain-string counterpart to <Numeral abbreviate />, for interpolating a
// figure into description text rather than rendering it as a component.
export function formatAbbreviatedNumber(value: number, abbreviate: boolean) {
    const precision = getAutoPrecision(value, 100, 2);
    const output = formatNumberRaw(value, ',', abbreviate, precision);
    if (!output) {
        return '0';
    }
    return `${output.value}${output.valueSuffix ?? ''}`;
}

export function buildCausePhrase(cause: 'conflict' | 'disaster' | undefined): string {
    if (cause === 'disaster') {
        return ' associated with disasters';
    }
    if (cause === 'conflict') {
        return ' associated with conflict and violence';
    }
    return '';
}

// Joins a list into "A", "A and B", or "A, B and C" (Oxford-style "and"
// before the final item) for the "filtered to..." sentences and the scope label.
export function joinWithAnd(items: string[]): string {
    if (items.length <= 1) {
        return items[0] ?? '';
    }
    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// "globally" when nothing is selected, else "in A, B and C" — the geography
// scope clause shared across the sidebar insight descriptions. Callers pass
// display names (selected regions first, then countries).
export function buildScopeLabel(names: string[]): string {
    return names.length === 0 ? 'globally' : `in ${joinWithAnd(names)}`;
}

// The trailing " Disaster/Conflict figures are filtered to the type(s) X, Y
// and Z." sentence. Empty string when the given cause has no active
// trigger-type sub-selection. Trigger labels read as common nouns mid-sentence,
// so they are lowercased, except all-caps abbreviations in brackets which are
// kept uppercase (e.g. "Real name (IUCN)" -> "real name (IUCN)").
export function buildTriggerFilterSuffix(params: {
    cause: 'conflict' | 'disaster';
    labels: string[];
}): string {
    const { cause, labels } = params;
    if (labels.length === 0) {
        return '';
    }
    const joined = joinWithAnd(labels.map((label) => toLowerCaseKeepAbbr(label) ?? label));
    if (cause === 'conflict') {
        return ` Conflict figures are filtered to the ${pluralize(labels.length, 'type', 'types')} ${joined}.`;
    }
    return ` Disaster figures are filtered to the ${pluralize(labels.length, 'hazard type', 'hazard types')} ${joined}.`;
}

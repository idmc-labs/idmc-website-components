import React from 'react';

import { formatNumberRaw, getAutoPrecision } from '#components/Numeral';
import { toSentenceCase } from '#components/IduMap/EventListItem';

// Regex to split the string by the templates
const splitRegex = /({[^{}]*})/g;

// Regex to test if a piece of string is a template or not
//
// and if so capture the template key
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
    // Generate a list of {key, value} from the splits
    // replacing the templates with params.
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

    // If params contains a react element,
    // return a react fragment with the splits separated by
    // spans.
    const withReactElement = hasReactElement(Object.values(params).flat());
    const flattenedResults = results.flat();

    if (withReactElement) {
        return (
            <>
                {flattenedResults.map(renderElement)}
            </>
        );
    }
    // Otherwise, return the concatenated string.
    return flattenedResults.map((r) => r.value).join('');
}

// ---- shared displacement-dashboard description helpers (GIDD + IDU) ----

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

// " associated with disasters" / " associated with conflict and violence" /
// "" — the cause clause shared across the sidebar insight descriptions.
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
// trigger-type sub-selection. Hazard types read as common nouns, so they are
// lowercased mid-sentence; violence sub-types are named categories and are
// sentence-cased instead.
export function buildTriggerFilterSuffix(params: {
    cause: 'conflict' | 'disaster';
    labels: string[];
}): string {
    const { cause, labels } = params;
    if (labels.length === 0) {
        return '';
    }
    if (cause === 'conflict') {
        const joined = joinWithAnd(labels.map((label) => toSentenceCase(label) ?? label));
        return ` Conflict figures are filtered to the ${pluralize(labels.length, 'type', 'types')} ${joined}.`;
    }
    const joined = joinWithAnd(labels.map((label) => label.toLowerCase()));
    return ` Disaster figures are filtered to the ${pluralize(labels.length, 'hazard type', 'hazard types')} ${joined}.`;
}

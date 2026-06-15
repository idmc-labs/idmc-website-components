import { isFalsyString, isInteger } from '@togglecorp/fujs';
import {
    standaloneMode,
    HELIX_CLIENT_CODE,
    parseQueryString,
} from '#utils/common';

// NOTE: Parse the query string once at module load.
const query = parseQueryString(window.location.search);

interface Win {
    [key: string]: unknown;
}

export type ReadSource = 'auto' | 'query';

export type ReadResult<T> =
    | { value: T; error: undefined }
    | { value: undefined; error: string };

function readRawParam(key: string, from: ReadSource = 'auto'): string | undefined {
    if (from === 'query' || standaloneMode) {
        return query[key];
    }
    return (window as unknown as Win)[key] as string | undefined;
}

export function readString(
    key: string,
    opts?: { required?: boolean; from?: ReadSource },
): ReadResult<string> {
    const { required, from } = opts ?? {};
    const rawParam = readRawParam(key, from);
    if (required && isFalsyString(rawParam)) {
        return {
            value: undefined,
            error: `Please provide "${key}" string query parameter.`,
        };
    }
    // NOTE: For optional fields the value may be undefined; that is acceptable.
    return { value: rawParam as string, error: undefined };
}

export function readInteger(
    key: string,
    opts?: { required?: boolean; from?: ReadSource },
): ReadResult<number> {
    const { required, from } = opts ?? {};
    const rawParam = readRawParam(key, from);
    const parsedParam = isFalsyString(rawParam)
        ? undefined
        : Number(rawParam);
    const intParam = isInteger(parsedParam)
        ? parsedParam
        : undefined;
    if (required && intParam === undefined) {
        return {
            value: undefined,
            error: `Please provide "${key}" integer query parameter.`,
        };
    }
    // NOTE: For optional fields the value may be undefined; that is acceptable.
    return { value: intParam as number, error: undefined };
}

export function readClientCode(
    opts?: { required?: boolean },
): ReadResult<string> {
    const { required } = opts ?? {};
    const value = standaloneMode
        ? query.clientCode
        : HELIX_CLIENT_CODE;

    if (required && isFalsyString(value)) {
        return {
            value: undefined,
            error: 'Please provide "clientCode" string query parameter.',
        };
    }

    return { value: value as string, error: undefined };
}

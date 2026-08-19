import { sum } from '@togglecorp/fujs';
import { parse } from 'graphql';

export const OTHER_BUCKET_ID = '__other__';

export interface BucketableItem {
    id: string;
    name: string;
    value: number;
}

export type BucketedItem = BucketableItem & { isOther?: boolean };

/**
 * Collapses items below `ratio` of the grand total into a single "Other" row,
 * appended last (the mockups always place it at the bottom, even when its sum
 * exceeds the row above it).
 *
 * A lone sub-threshold item keeps its own name — bucketing a single item would
 * lose information for no gain. Expects `items` sorted descending by value and
 * preserves that order for the items it does not collapse.
 */
export function bucketSmallValues<T extends BucketableItem>(
    items: T[],
    ratio = 0.01,
): BucketedItem[] {
    const grandTotal = sum(items.map((item) => item.value));
    if (grandTotal <= 0) {
        return items;
    }

    const threshold = grandTotal * ratio;
    const major = items.filter((item) => item.value >= threshold);
    const minor = items.filter((item) => item.value < threshold);

    if (minor.length <= 1) {
        return items;
    }

    return [
        ...major,
        {
            id: OTHER_BUCKET_ID,
            name: 'Other',
            value: sum(minor.map((item) => item.value)),
            isOther: true,
        },
    ];
}

export interface TypeOption {
    id: string;
    name: string;
}

export interface BreakdownStats {
    newDisplacements?: number | null;
    newDisplacementsRounded?: number | null;
    totalDisplacements?: number | null;
    totalDisplacementsRounded?: number | null;
}

export type BreakdownQueryResult = Record<string, BreakdownStats | null | undefined>;

export interface BreakdownQueryVariables {
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    releaseEnvironment: string;
    clientId: string;
}

type BreakdownVariant = 'conflict' | 'disaster';

// Callers always pair this with `skip: types.length === 0` on the useQuery,
// but that only stops the request from firing — the query document below is
// still built (and parsed) unconditionally every render, and an empty `types`
// list would produce an empty (invalid) selection set. Parsed once so an
// empty-list render never calls `parse()` on the fly.
const EMPTY_BREAKDOWN_QUERY = parse(`
    query GiddTypeBreakdownEmpty {
        __typename
    }
`);

// There is no server-side "breakdown by type" field that carries both flow and
// stock (displacementsByHazardType is flow-only, and the conflict statistics
// have no by-violence breakdown at all). The statistics queries do accept the
// typology filters though, so one aliased sub-query per type gets both metrics
// in a single round trip.
export function buildBreakdownQuery(variant: BreakdownVariant, types: TypeOption[]) {
    if (types.length === 0) {
        return EMPTY_BREAKDOWN_QUERY;
    }

    const field = variant === 'conflict'
        ? 'giddPublicConflictStatistics'
        : 'giddPublicDisasterStatistics';
    const typeArg = variant === 'conflict' ? 'violenceSubTypes' : 'hazardTypes';

    const selections = types.map((type) => `
        t${type.id}: ${field}(
            ${typeArg}: ["${type.id}"],
            countriesIso3: $countriesIso3,
            startYear: $startYear,
            endYear: $endYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            newDisplacements
            newDisplacementsRounded
            totalDisplacements
            totalDisplacementsRounded
        }
    `).join('\n');

    // NOTE: built with graphql's `parse` rather than the `gql` tag on purpose.
    // The selection set is assembled at runtime from the type list, so the
    // template is not a valid document until interpolated — both the
    // graphql/template-strings lint rule and graphql-codegen's document scanner
    // would try (and fail) to parse the raw template if this used `gql`.
    return parse(`
        query GiddTypeBreakdown(
            $countriesIso3: [String!],
            $startYear: Float,
            $endYear: Float,
            $releaseEnvironment: String!,
            $clientId: String!,
        ){
            ${selections}
        }
    `);
}

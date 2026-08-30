import { useMemo } from 'react';
import { sum } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import { DATA_RELEASE } from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    Crisis_Type as CrisisType,
    GiddHazardBreakdownQuery,
    GiddViolenceBreakdownQuery,
    GiddTopCountriesQuery,
    GiddTopCountriesQueryVariables,
} from '#generated/types';

// The server filters cause by enum (CRISIS_TYPE); the UI keys its cause options in lowercase, so
// the two are mapped rather than cast.
export const CAUSE_BY_KEY: Record<string, CrisisType> = {
    conflict: 'CONFLICT',
    disaster: 'DISASTER',
};

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

export interface BreakdownQueryVariables {
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    releaseEnvironment: string;
    clientId: string;
    hazardTypes?: string[];
    violenceSubTypes?: string[];
}

export type HazardBreakdownEntry = NonNullable<
    GiddHazardBreakdownQuery['giddPublicDisasterStatistics']['displacementsByHazardType']
>[number];

export type ViolenceBreakdownEntry = NonNullable<
    GiddViolenceBreakdownQuery['giddPublicConflictStatistics']['displacementsByViolenceSubType']
>[number];

// Both breakdown entries carry the same shape (id/label/new+total
// displacements) — GiddMap and TypeBreakdownCard handle either one uniformly.
export type BreakdownEntry = HazardBreakdownEntry & ViolenceBreakdownEntry;

export const HAZARD_BREAKDOWN_QUERY = gql`
    query GiddHazardBreakdown(
        $countriesIso3: [String!],
        $startYear: Float,
        $endYear: Float,
        $hazardTypes: [ID!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddPublicDisasterStatistics(
            countriesIso3: $countriesIso3,
            startYear: $startYear,
            endYear: $endYear,
            hazardTypes: $hazardTypes,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            displacementsByHazardType {
                id
                label
                newDisplacements
                newDisplacementsRounded
                totalDisplacements
                totalDisplacementsRounded
            }
        }
    }
`;

export const VIOLENCE_BREAKDOWN_QUERY = gql`
    query GiddViolenceBreakdown(
        $countriesIso3: [String!],
        $startYear: Float,
        $endYear: Float,
        $violenceSubTypes: [ID!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddPublicConflictStatistics(
            countriesIso3: $countriesIso3,
            startYear: $startYear,
            endYear: $endYear,
            violenceSubTypes: $violenceSubTypes,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            displacementsByViolenceSubType {
                id
                label
                newDisplacements
                newDisplacementsRounded
                totalDisplacements
                totalDisplacementsRounded
            }
        }
    }
`;

export const TOP_COUNTRIES_QUERY = gql`
    query GiddTopCountries(
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $cause: CRISIS_TYPE,
        $hazardTypes: [ID!],
        $violenceSubTypes: [ID!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicCountryDisplacements(
            countriesIso3: $countriesIso3,
            cause: $cause,
            endYear: $endYear,
            startYear: $startYear,
            hazardTypes: $hazardTypes,
            violenceSubTypes: $violenceSubTypes,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
            iso3
            countryName
            conflictNewDisplacement
            conflictTotalDisplacement
            disasterNewDisplacement
            disasterTotalDisplacement
        }
    }
`;

export interface RankedCountry {
    iso3: string;
    countryName: string;
    conflict: number;
    disaster: number;
    total: number;
}

export interface UseCountryRankingParams {
    category: 'flow' | 'stock' | undefined;
    cause: 'conflict' | 'disaster' | undefined;
    countriesIso3: string[];
    hazardTypes?: string[];
    violenceSubTypes?: string[];
    startYear: number;
    endYear: number;
    clientId: string;
    skip?: boolean;
}

// Full filtered + sorted (not sliced) list plus its grand total — callers
// slice the top N themselves so the "N accounts for X%" share is computed
// against the true total, not just the visible rows.
export function useCountryRanking(params: UseCountryRankingParams) {
    const {
        category,
        cause,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        startYear,
        endYear,
        clientId,
        skip,
    } = params;

    const isStock = category === 'stock';
    const conflictShown = cause !== 'disaster';
    const disasterShown = cause !== 'conflict';

    const variables = useMemo(() => ({
        countriesIso3,
        cause: cause ? CAUSE_BY_KEY[cause] : undefined,
        startYear: isStock ? endYear : startYear,
        endYear,
        hazardTypes,
        violenceSubTypes,
        releaseEnvironment: DATA_RELEASE,
        clientId,
    }), [
        countriesIso3,
        cause,
        isStock,
        startYear,
        endYear,
        hazardTypes,
        violenceSubTypes,
        clientId,
    ]);

    const debouncedVariables = useDebouncedValue(variables);

    const {
        previousData,
        data = previousData,
        loading,
    } = useQuery<GiddTopCountriesQuery, GiddTopCountriesQueryVariables>(
        TOP_COUNTRIES_QUERY,
        {
            variables: debouncedVariables,
            skip,
            context: {
                clientName: 'helix',
            },
        },
    );

    const pending = loading && !data;

    const rankedCountries = useMemo<RankedCountry[]>(() => {
        const rows = data?.giddPublicCountryDisplacements ?? [];
        return rows
            .map((row) => {
                const conflict = (isStock
                    ? row.conflictTotalDisplacement
                    : row.conflictNewDisplacement) ?? 0;
                const disaster = (isStock
                    ? row.disasterTotalDisplacement
                    : row.disasterNewDisplacement) ?? 0;
                const scopedConflict = conflictShown ? conflict : 0;
                const scopedDisaster = disasterShown ? disaster : 0;
                return {
                    iso3: row.iso3,
                    countryName: row.countryName,
                    conflict: scopedConflict,
                    disaster: scopedDisaster,
                    total: scopedConflict + scopedDisaster,
                };
            })
            .filter((row) => row.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [data, isStock, conflictShown, disasterShown]);

    const grandTotal = useMemo(
        () => sum(rankedCountries.map((row) => row.total)),
        [rankedCountries],
    );

    return { pending, rankedCountries, grandTotal };
}

import { sum } from '@togglecorp/fujs';
import { gql } from '@apollo/client';

import {
    GiddHazardBreakdownQuery,
    GiddViolenceBreakdownQuery,
} from '#generated/types';

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
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddPublicDisasterStatistics(
            countriesIso3: $countriesIso3,
            startYear: $startYear,
            endYear: $endYear,
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
        $releaseEnvironment: String!,
        $clientId: String!,
    ) {
        giddPublicConflictStatistics(
            countriesIso3: $countriesIso3,
            startYear: $startYear,
            endYear: $endYear,
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

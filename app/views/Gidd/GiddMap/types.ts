import { BreakdownEntry } from '../utils';

export type { Cause, Category } from '../types';

export type MarkerCause = 'Conflict' | 'Disaster';

export interface PointProperties {
    iso3: string;
    name: string;
    cause: MarkerCause;
    value: number;
    // The same figure for the metric the map is not showing, resolved by the map so the
    // popup never re-sums rounded parts.
    otherValue: number;
    radius?: number;
    iconName?: string;
    conflictNew?: number;
    conflictTotal?: number;
    disasterNew?: number;
    disasterTotal?: number;
}

export type BreakdownDisplayItem = BreakdownEntry & { value: number };

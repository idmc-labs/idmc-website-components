import { BreakdownEntry } from '../utils';

export type MarkerCause = 'Conflict' | 'Disaster';

export interface PointProperties {
    iso3: string;
    name: string;
    cause: MarkerCause;
    value: number;
    radius?: number;
    iconName?: string;
    conflictNew?: number;
    conflictTotal?: number;
    disasterNew?: number;
    disasterTotal?: number;
}

export type Cause = 'conflict' | 'disaster';
export type Category = 'flow' | 'stock';

export type BreakdownDisplayItem = BreakdownEntry & { value: number };

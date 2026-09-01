export type Cause = 'conflict' | 'disaster';
export type Category = 'flow' | 'stock';

/**
 * The dashboard-wide filter, as the two tables consume it.
 *
 * Held once in `Gidd/index.tsx` and copied into each table's own filter state, so a table can
 * carry its own page, page size and sorting without those leaking to its sibling.
 */
export interface GiddTableFilter {
    cause: Cause | undefined;
    category: Category | undefined;
    countriesIso3: string[] | undefined;
    hazardTypes: string[] | undefined;
    violenceSubTypes: string[] | undefined;
    startYear: number;
    endYear: number;
}

/** The shared filter plus the event name, which only the events endpoint accepts. */
export interface GiddEventsFilter extends GiddTableFilter {
    eventName: string | undefined;
}

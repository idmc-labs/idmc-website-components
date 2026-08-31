import { SetStateAction, useEffect } from 'react';

/**
 * Copies a dashboard-wide filter into one table's own filter state.
 *
 * The flow is one-directional -- shared into local, never back -- and merges rather than replaces,
 * so a field the table owns by itself (an event search box, say) survives a shared-filter change.
 * Writing through `setFilter` is what returns the table to page 1.
 */
function useSyncedFilter<FILTER>(
    sharedFilter: Partial<FILTER>,
    setFilter: (value: SetStateAction<FILTER>) => void,
) {
    useEffect(() => {
        setFilter((prevFilter) => ({
            ...prevFilter,
            ...sharedFilter,
        }));
    }, [sharedFilter, setFilter]);
}

export default useSyncedFilter;

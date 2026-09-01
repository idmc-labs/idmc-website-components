import {
    SetStateAction,
    useReducer,
    useCallback,
    useMemo,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { EntriesAsList } from '@togglecorp/toggle-form';

import useDebouncedValue from '#hooks/useDebouncedValue';

type SortDirection = 'asc' | 'dsc';

export interface SortParameter {
    name: string;
    direction: SortDirection;
}

export interface FilterStateResponse<FILTER> {
    rawFilter: FILTER;
    filter: FILTER;
    setFilter: (value: SetStateAction<FILTER>) => void;
    setFilterField: (...args: EntriesAsList<FILTER>) => void;
    resetFilter: () => void;

    rawPage: number;
    page: number;
    setPage: (value: number) => void;

    rawPageSize: number;
    pageSize: number;
    setPageSize: (value: number) => void;

    rawOrdering: string | undefined;
    ordering: string | undefined;
    sortState: {
        sorting: SortParameter | undefined;
        setSorting: (value: SetStateAction<SortParameter | undefined>) => void;
    };
}

function getOrdering(sorting: SortParameter | undefined) {
    if (isNotDefined(sorting)) {
        return undefined;
    }
    if (sorting.direction === 'asc') {
        return sorting.name;
    }
    return `-${sorting.name}`;
}

interface ResetFilterAction {
    type: 'reset-filter';
}

interface SetFilterAction<FILTER> {
    type: 'set-filter';
    value: SetStateAction<FILTER>;
}

interface SetPageAction {
    type: 'set-page';
    value: number;
}

interface SetPageSizeAction {
    type: 'set-page-size';
    value: number;
}

interface SetOrderingAction {
    type: 'set-ordering';
    value: SetStateAction<SortParameter | undefined>;
}

type FilterActions<FILTER> = (
    ResetFilterAction
    | SetFilterAction<FILTER>
    | SetPageAction
    | SetPageSizeAction
    | SetOrderingAction
);

interface FilterState<FILTER> {
    filter: FILTER;
    initialFilter: FILTER;
    ordering: SortParameter | undefined;
    page: number;
    pageSize: number;
}

/**
 * Holds one table's filter, page, page size and sorting as a single unit.
 *
 * Anything that changes which rows exist -- the filter, the sorting, the page size -- returns to
 * page 1, because a page number only means something against the result set it was chosen from.
 * The `raw*` values drive the controls; the debounced ones drive the query, so dragging a slider
 * costs one request rather than one per frame.
 *
 * Every option seeds the first render only. To feed a table a filter that changes over time, pass
 * it through `useSyncedFilter` instead.
 */
function useFilterState<FILTER>(options: {
    filter: FILTER;
    ordering?: SortParameter | undefined;
    page?: number;
    pageSize?: number;
    debounceTime?: number;
}): FilterStateResponse<FILTER> {
    const {
        filter,
        ordering,
        page = 1,
        pageSize = 10,
        debounceTime = 200,
    } = options;

    type Reducer = (
        prevState: FilterState<FILTER>,
        action: FilterActions<FILTER>,
    ) => FilterState<FILTER>;

    const [state, dispatch] = useReducer<Reducer>(
        (prevState, action) => {
            if (action.type === 'reset-filter') {
                return {
                    ...prevState,
                    filter: prevState.initialFilter,
                    page: 1,
                };
            }
            if (action.type === 'set-filter') {
                return {
                    ...prevState,
                    filter: typeof action.value === 'function'
                        ? (action.value as (prev: FILTER) => FILTER)(prevState.filter)
                        : action.value,
                    page: 1,
                };
            }
            if (action.type === 'set-page') {
                return {
                    ...prevState,
                    page: action.value,
                };
            }
            if (action.type === 'set-page-size') {
                return {
                    ...prevState,
                    pageSize: action.value,
                    page: 1,
                };
            }
            if (action.type === 'set-ordering') {
                return {
                    ...prevState,
                    ordering: typeof action.value === 'function'
                        ? action.value(prevState.ordering)
                        : action.value,
                    page: 1,
                };
            }
            return prevState;
        },
        {
            filter,
            initialFilter: filter,
            ordering,
            page,
            pageSize,
        },
    );

    const setFilter = useCallback((value: SetStateAction<FILTER>) => {
        dispatch({ type: 'set-filter', value });
    }, []);

    const setFilterField = useCallback((...args: EntriesAsList<FILTER>) => {
        const [val, key] = args;
        setFilter((oldValue) => ({
            ...oldValue,
            [key]: val,
        }));
    }, [setFilter]);

    const resetFilter = useCallback(() => {
        dispatch({ type: 'reset-filter' });
    }, []);

    const setPage = useCallback((value: number) => {
        dispatch({ type: 'set-page', value });
    }, []);

    const setPageSize = useCallback((value: number) => {
        dispatch({ type: 'set-page-size', value });
    }, []);

    const setSorting = useCallback((value: SetStateAction<SortParameter | undefined>) => {
        dispatch({ type: 'set-ordering', value });
    }, []);

    const debouncedState = useDebouncedValue(state, debounceTime);

    const sortState = useMemo(() => ({
        sorting: state.ordering,
        setSorting,
    }), [state.ordering, setSorting]);

    return {
        rawFilter: state.filter,
        filter: debouncedState.filter,
        setFilter,
        setFilterField,
        resetFilter,

        rawPage: state.page,
        page: debouncedState.page,
        setPage,

        rawPageSize: state.pageSize,
        pageSize: debouncedState.pageSize,
        setPageSize,

        rawOrdering: getOrdering(state.ordering),
        ordering: getOrdering(debouncedState.ordering),
        sortState,
    };
}

export default useFilterState;

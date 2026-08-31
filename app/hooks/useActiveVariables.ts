import { useRef } from 'react';

/**
 * The last query variables this pane saw while it was on screen.
 *
 * A hidden pane holds its old variables, so a filter change costs it no request; showing it again
 * releases the current ones and the query refetches once. Apollo's own `skip` cannot do this --
 * it suppresses the request, but does not re-run the query for variables that changed while
 * skipped, so the pane comes back showing results for the filter the user has already left.
 *
 * A pane only mounts when it is first shown, so nothing is needed to stop its first fetch.
 */
function useActiveVariables<VARIABLES>(variables: VARIABLES, active: boolean): VARIABLES {
    const held = useRef(variables);
    if (active) {
        held.current = variables;
    }
    return held.current;
}

export default useActiveVariables;

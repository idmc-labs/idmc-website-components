import { useMemo } from 'react';
import { randomString } from '@togglecorp/fujs';

function useId() {
    const id = useMemo(() => randomString(), []);
    return id;
}

export default useId;

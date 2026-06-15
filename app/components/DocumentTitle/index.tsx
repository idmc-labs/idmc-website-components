import { useLayoutEffect } from 'react';

import { standaloneMode } from '#utils/common';

export interface Props {
    value: string;
}

function DocumentTitle({ value }: Props) {
    useLayoutEffect(
        () => {
            // We only want to set document title in standalone mode
            if (!standaloneMode) {
                return;
            }
            document.title = value;
        },
        [value],
    );
    return null;
}

export default DocumentTitle;

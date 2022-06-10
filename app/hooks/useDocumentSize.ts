import React from 'react';
import useDebouncedValue from './useDebouncedValue';

function useDocumentSize(use = true) {
    const [size, setSize] = React.useState<{
        width: number;
        height: number;
    }>({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    });

    const handleResize = React.useCallback(() => {
        setSize({
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        });
    }, []);

    React.useEffect(() => {
        if (use) {
            window.addEventListener('resize', handleResize);
            document.addEventListener('resize', handleResize);
        }

        return () => {
            document.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, [use, handleResize]);

    const debouncedSize = useDebouncedValue(size);

    return debouncedSize;
}

export default useDocumentSize;

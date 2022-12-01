import { useState, useEffect } from 'react';
import { isNotDefined } from '@togglecorp/fujs';

export default function useLocalStorage<T>(key: string, defaultValue: T, debounce = true) {
    const [value, setValue] = useState<T>((): T => {
        const val = localStorage.getItem(key);
        return val === null || val === undefined
            ? defaultValue
            : JSON.parse(val) as T;
    });

    useEffect(
        () => {
            const update = () => {
                if (isNotDefined(value)) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            };
            if (debounce) {
                const timeout = setTimeout(update, 200);
                return () => {
                    clearTimeout(timeout);
                };
            }

            update();
            return undefined;
        },
        [key, value, debounce],
    );

    return [value, setValue] as const;
}

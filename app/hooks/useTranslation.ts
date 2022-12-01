import { useMemo, useContext } from 'react';

import LanguageContext, { Lang } from '../context/LanguageContext';

type Translations<T> = {
    [key in keyof T]: {
        [langkey in Lang]: string;
    };
}

export default function useTranslation<T>(translations: Translations<T>) {
    const {
        lang,
    } = useContext(LanguageContext);

    type ReturnValue = { [key in keyof T ]: string };

    const mappedData = useMemo(() => {
        const keys = Object.keys(translations) as (keyof T)[];

        return keys.reduce(
            (acc, key) => ({
                ...acc,
                [key]: translations[key][lang],
            }),
            // NOTE: acc will not be ReturnValue unless all the keys are iterated
            {} as ReturnValue,
        );
    }, [lang, translations]);

    return mappedData;
}

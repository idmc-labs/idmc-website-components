import { createContext } from 'react';

export type Lang = 'en' | 'fr';

export interface LanguageContextInterface {
    lang: Lang;
    setLang: (lang: Lang) => void;
    debug: boolean;
}

export interface LangOption {
    key: Lang;
    label: string;
}

export const langOptions: LangOption[] = [
    {
        key: 'en',
        label: 'English',
    },
    {
        key: 'fr',
        label: 'French',
    },
];

export const langKeySelector = (d: LangOption) => d.key;
export const langLabelSelector = (d: LangOption) => d.label;

export default createContext<LanguageContextInterface>({
    lang: 'en',
    setLang: (lang: Lang) => {
        // eslint-disable-next-line no-console
        console.warn('Trying to set language before the language context was initialized.', lang);
    },
    debug: false,
});

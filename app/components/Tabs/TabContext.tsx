import React from 'react';

export type TabKey = string;
export type TabVariant = 'primary' | 'secondary' | 'step';

export type TabContextProps = {
    variant?: TabVariant;
    disabled?: boolean;
    tabs: TabKey[];
    registerTab: (tab: TabKey) => void;
    unregisterTab: (tab: TabKey) => void;
    step: number;
    setStep?: React.Dispatch<React.SetStateAction<number>>;
    useHash?: false;
    activeTab: TabKey | undefined;
    setActiveTab: (key: TabKey | undefined) => void;
}

export const TabContext = React.createContext<TabContextProps>({
    tabs: [],
    step: 0,
    disabled: false,
    activeTab: '',
    variant: 'primary',
    setActiveTab: () => {
        // eslint-disable-next-line no-console
        console.warn('setActiveTab called before it was initialized');
    },
    registerTab: () => {
        // eslint-disable-next-line no-console
        console.warn('registerTab called before it was initialized');
    },
    unregisterTab: () => {
        // eslint-disable-next-line no-console
        console.warn('unregisterTab called before it was initialized');
    },
});

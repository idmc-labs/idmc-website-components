import React from 'react';

export type TabKey = string;
export type TabVariant = 'primary' | 'secondary' | 'step';

export type TabContextProps = {
    activeTab: TabKey | undefined;
    disabled?: boolean;
    registerTab: (tab: TabKey) => void;
    setActiveTab: (key: TabKey | undefined) => void;
    setStep?: React.Dispatch<React.SetStateAction<number>>;
    step: number;
    tabs: TabKey[];
    unregisterTab: (tab: TabKey) => void;
    variant?: TabVariant;
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

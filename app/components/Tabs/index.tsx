import React from 'react';

import {
    TabKey,
    TabVariant,
    TabContext,
} from '#components/Tabs/TabContext';

export interface Props<T extends TabKey | undefined> {
    children: React.ReactNode;
    variant?: TabVariant;
    disabled?: boolean;
    value: T;
    onChange: (key: T) => void;
}

export function Tabs<T extends TabKey | undefined>(props: Props<T>) {
    const {
        children,
        variant = 'primary',
        disabled,
        value,
        onChange,
    } = props;

    const [tabs, setTabs] = React.useState<T[]>([]);
    const [step, setStep] = React.useState(0);

    const registerTab = React.useCallback((name) => {
        setTabs((prevTabs) => {
            const i = prevTabs.findIndex((d) => d === name);
            if (i === -1) {
                return [...prevTabs, name];
            }

            return prevTabs;
        });
    }, [setTabs]);

    const unregisterTab = React.useCallback((name) => {
        setTabs((prevTabs) => {
            const i = prevTabs.findIndex((d) => d === name);
            if (i !== -1) {
                const newTabs = [...prevTabs];
                newTabs.splice(i, 1);
                return newTabs;
            }

            return prevTabs;
        });
    }, [setTabs]);

    const contextValue = React.useMemo(() => ({
        activeTab: value,
        disabled,
        registerTab,
        setActiveTab: onChange as (tabKey: TabKey| undefined) => void,
        setStep,
        step,
        tabs: tabs as string[],
        unregisterTab,
        variant,
    }), [
        tabs,
        value,
        onChange,
        variant,
        disabled,
        registerTab,
        unregisterTab,
        step,
        setStep,
    ]);

    return (
        <TabContext.Provider value={contextValue}>
            { children }
        </TabContext.Provider>
    );
}

export default Tabs;

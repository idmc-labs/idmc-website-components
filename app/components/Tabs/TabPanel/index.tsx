import React from 'react';
import { TabKey, TabContext } from '../TabContext';

export interface Props extends React.HTMLProps<HTMLDivElement> {
    name: TabKey;
    elementRef?: React.Ref<HTMLDivElement>;
}

export default function TabPanel(props: Props) {
    const context = React.useContext(TabContext);

    const {
        name,
        elementRef,
        ...otherProps
    } = props;

    const isActive = context.activeTab === name;

    if (!isActive) {
        return null;
    }

    return (
        <div
            {...otherProps}
            role="tabpanel"
            ref={elementRef}
        />
    );
}

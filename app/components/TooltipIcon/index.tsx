import React from 'react';
import { IoInformationCircleOutline } from 'react-icons/io5';

import DropdownMenu from '#components/DropdownMenu';

// import styles from './styles.css';

interface TooltipIconProps {
    infoLabel?: React.ReactNode;
    children?: React.ReactNode;
}
function TooltipIcon(props: TooltipIconProps) {
    const {
        infoLabel = <IoInformationCircleOutline />,
        children,
    } = props;

    if (!children) {
        return null;
    }

    return (
        <DropdownMenu
            label={infoLabel}
        >
            {children}
        </DropdownMenu>
    );
}

export default TooltipIcon;

import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoRefreshOutline } from 'react-icons/io5';
import { PendingMessage } from '@togglecorp/toggle-ui';

import Button from '../Button';
import QuickActionButton from '../QuickActionButton';
import { genericMemo } from '../../utils';

import styles from './styles.css';

export interface Props {
    className?: string;
    pending?: boolean;
    empty?: boolean;
    filtered?: boolean;
    errored?: boolean;
    icon?: React.ReactNode;
    emptyIcon?: React.ReactNode;
    filteredEmptyIcon?: React.ReactNode;
    erroredEmptyIcon?: React.ReactNode;
    onReload?: () => void;
    actions?: React.ReactNode;
    message?: React.ReactNode;
    pendingMessage?: React.ReactNode;
    emptyMessage?: React.ReactNode;
    filteredEmptyMessage?: React.ReactNode;
    erroredEmptyMessage?: React.ReactNode;
    pendingContainerClassName?: string;
    actionsContainerClassName?: string;
    compact?: boolean;
    compactAndVertical?: boolean;
    compactPendingMessage?: boolean;
    compactEmptyMessage?: boolean;
    messageHidden?: boolean;
    messageIconHidden?: boolean;
}

function Message(props: Props) {
    const {
        className,
        pending,
        empty,
        filtered,
        errored,
        icon: iconFromProps,
        emptyIcon,
        filteredEmptyIcon,
        erroredEmptyIcon,
        message: messageFromProps,
        pendingMessage,
        emptyMessage = 'No data available',
        filteredEmptyMessage = 'No matching data',
        erroredEmptyMessage = 'Oops! We ran into an issue',
        pendingContainerClassName,
        compact,
        compactPendingMessage,
        compactEmptyMessage,
        compactAndVertical,
        messageHidden = false,
        messageIconHidden = false,
        onReload,
        actions,
        actionsContainerClassName,
    } = props;

    if (pending) {
        return (
            <PendingMessage
                className={pendingContainerClassName}
                message={pendingMessage}
                compact={compactPendingMessage || compact}
            />
        );
    }

    const icon: React.ReactNode = iconFromProps;
    const message: React.ReactNode = messageFromProps;

    if (!icon && !message) {
        return null;
    }

    const showActions = (errored && onReload) || actions;

    return (
        <div
            className={_cs(
                className,
                styles.message,
                (compactAndVertical || compact || compactEmptyMessage) && styles.compact,
                compactAndVertical && styles.vertical,
            )}
        >
            {!messageIconHidden && (
                <div className={styles.iconContainer}>
                    {icon}
                </div>
            )}
            {!messageHidden && (
                <div className={styles.content}>
                    { message }
                </div>
            )}
            {showActions && (
                <div className={_cs(styles.actions, actionsContainerClassName)}>
                    {onReload && compact && (
                        <QuickActionButton
                            name={undefined}
                            onClick={onReload}
                            variant="secondary"
                        >
                            <IoRefreshOutline />
                        </QuickActionButton>
                    )}
                    {onReload && !compact && (
                        <Button
                            name={undefined}
                            onClick={onReload}
                            variant="secondary"
                            icons={(
                                <IoRefreshOutline />
                            )}
                        >
                            Reload
                        </Button>
                    )}
                    {actions}
                </div>
            )}
        </div>
    );
}

export default genericMemo(Message);
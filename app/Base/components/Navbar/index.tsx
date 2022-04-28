import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    QuickActionLink,
} from '@the-deep/deep-ui';
import {
    IoHelp,
} from 'react-icons/io5';

import SmartNavLink from '#base/components/SmartNavLink';
import route from '#base/configs/routes';

import styles from './styles.css';

interface Props {
    className?: string;
}

function Navbar(props: Props) {
    const { className } = props;

    return (
        <nav className={_cs(className, styles.navbar)}>
            <div className={styles.appBrand}>
                IDMC
            </div>
            <div className={styles.main}>
                <div className={styles.navLinks}>
                    <SmartNavLink
                        exact
                        route={route.home}
                        className={styles.link}
                    />
                    <SmartNavLink
                        exact
                        route={route.countryProfile}
                        attrs={{
                            id: 'IND',
                        }}
                        className={styles.link}
                    />
                    <SmartNavLink
                        exact
                        route={route.goodPractices}
                        className={styles.link}
                    />
                </div>
                <div className={styles.actions}>
                    <QuickActionLink
                        to="https://togglecorp.com"
                    >
                        <IoHelp />
                    </QuickActionLink>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

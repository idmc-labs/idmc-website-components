import React from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { PendingAnimation } from '@togglecorp/toggle-ui';
import useIduMap from '#components/IduMap/useIduMap';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TooltipIcon from '#components/TooltipIcon';

import {
    CountryProfileIduQuery,
    CountryProfileIduQueryVariables,
} from '#generated/types';

import { suffixDrupalEndpoint } from '#utils/common';
import { countryMetadata } from '../CountryProfile/data';
import styles from './styles.css';

const giddLink = suffixDrupalEndpoint('/database');
const monitoringLink = suffixDrupalEndpoint('/monitoring-tools');

const COUNTRY_PROFILE = gql`
    query CountryProfileIdu($iso3: String!) {
        countryProfile(iso3: $iso3) {
            id
            boundingBox
            internalDisplacementDescription
        }
    }
`;

interface IduWidgetProps {
    iso3: string;
    clientCode: string;
}

function IduWidget(props: IduWidgetProps) {
    const {
        iso3,
        clientCode,
    } = props;

    const {
        previousData,
        data: countryProfileData = previousData,
        // TODO: handle loading and error
    } = useQuery<CountryProfileIduQuery, CountryProfileIduQueryVariables>(
        COUNTRY_PROFILE,
        {
            variables: {
                iso3,
            },
        },
    );

    const countryInfo = countryProfileData?.countryProfile;

    const {
        idus,
        pending,
        widget: iduWidget,
    } = useIduMap(
        clientCode,
        iso3,
    );

    if (!pending && !(idus && idus.length > 0) && !countryInfo?.internalDisplacementDescription) {
        return null;
    }

    return (
        <section
            id="internal-displacement"
            className={styles.internalDisplacementUpdates}
        >
            {pending && (
                <div className={styles.pendingOverlay}>
                    <PendingAnimation />
                </div>
            )}
            <Header
                headingSize="large"
                heading={countryMetadata.internalDisplacementUpdatesHeader}
                headingInfo={(
                    <TooltipIcon>
                        {countryMetadata.internalDisplacementUpdatesTooltip}
                    </TooltipIcon>
                )}
            />
            <p>
                {/* eslint-disable-next-line max-len, react/jsx-one-expression-per-line */}
                IDMC&apos;s Internal Displacement Updates (IDU) are preliminary estimates of internal displacement events reported in the last 180 days. This provisional data is updated daily with new available data. Curated and validated estimates are published in the <a href={giddLink}>Global Internal Displacement Database (GIDD).</a> To find out more about how we monitor and report on our figures, click <a href={monitoringLink}>here.</a>
            </p>
            {countryInfo?.internalDisplacementDescription && (
                <EllipsizedContent>
                    <HTMLOutput
                        value={countryInfo?.internalDisplacementDescription}
                    />
                </EllipsizedContent>
            )}
            {idus && idus.length > 0 && (
                <div className={styles.iduContainer}>
                    <div className={styles.mapDescription}>
                        Hover over and click on the coloured bubbles to see near real-time
                        snapshots of situations of internal displacement.
                    </div>
                    {iduWidget}
                </div>
            )}
        </section>
    );
}
export default IduWidget;

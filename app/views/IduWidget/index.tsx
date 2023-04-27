import React, { useCallback, useState } from 'react';
import {
    LngLatBounds,
} from 'mapbox-gl';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoArrowDown,
    IoArrowUp,
} from 'react-icons/io5';

import Button from '#components/Button';
import useIduMap from '#components/IduMap/useIduMap';
import Header from '#components/Header';
import HTMLOutput from '#components/HTMLOutput';
import EllipsizedContent from '#components/EllipsizedContent';
import TooltipIcon from '#components/TooltipIcon';
import DisplacementIcon from '#components/DisplacementIcon';

import {
    CountryProfileIduQuery,
    CountryProfileIduQueryVariables,
} from '#generated/types';

import { countryMetadata } from '../CountryProfile/data';
import styles from './styles.css';

const DRUPAL_ENDPOINT = process.env.REACT_APP_DRUPAL_ENDPOINT as string || '';

// FIXME: move this to utils
function suffixDrupalEndpoint(path: string) {
    return `${DRUPAL_ENDPOINT}${path}`;
}
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
}

function IduWidget(props: IduWidgetProps) {
    const {
        iso3,
    } = props;

    // IDU list section
    const [iduActivePage, setIduActivePage] = useState(1);
    const iduPageSize = 2;

    // IDU map section
    const {
        previousData,
        data: countryProfileData = previousData,
        // FIXME: handle loading and error
        // loading: countryProfileLoading,
        // error: countryProfileError,
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
        widget: iduWidget,
    } = useIduMap(
        countryInfo?.boundingBox as LngLatBounds | undefined,
        iso3,
    );

    const handleIduActivePage = useCallback(() => {
        setIduActivePage((val) => val + 1);
    }, [setIduActivePage]);

    const showlessIduPage = useCallback(() => {
        setIduActivePage(1);
    }, [setIduActivePage]);

    if (!(idus && idus.length > 0) && !countryInfo?.internalDisplacementDescription) {
        return null;
    }

    return (
        <section
            className={styles.internalDisplacementUpdates}
        >
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
                IDMC&apos;s Internal Displacement Updates (IDU) are preliminary estimates of new displacement events reported in the last 180 days. This provisional data is updated daily with new available data. Curated and validated estimates are published in the <a href={giddLink}>Global Internal Displacement Database (GIDD).</a> To find out more about how we monitor and report on our figures, click <a href={monitoringLink}>here.</a>
            </p>
            <EllipsizedContent>
                <HTMLOutput
                    value={countryInfo?.internalDisplacementDescription}
                />
            </EllipsizedContent>
            {idus && idus.length > 0 && (
                <>
                    <div className={styles.iduContainer}>
                        {idus.slice(0, iduActivePage * iduPageSize)?.map((idu) => (
                            <div
                                key={idu.id}
                                className={styles.idu}
                            >
                                <div className={styles.displacementIcon}>
                                    <DisplacementIcon
                                        className={styles.icon}
                                        displacementType={idu.displacement_type}
                                        disasterType={idu.type}
                                    />
                                    <div>
                                        {idu.displacement_type === 'Disaster'
                                            ? `${idu.displacement_type} - ${idu.type}`
                                            : idu.displacement_type}
                                    </div>
                                </div>
                                <HTMLOutput
                                    value={idu.standard_popup_text}
                                />
                            </div>
                        ))}
                        <div className={styles.iduPager}>
                            {idus.length > (iduActivePage * iduPageSize) && (
                                <Button
                                    name={undefined}
                                    onClick={handleIduActivePage}
                                    actions={<IoArrowDown />}
                                    variant="transparent"
                                >
                                    Show Older Displacements
                                </Button>
                            )}
                            {iduActivePage > 1 && (
                                <Button
                                    name={undefined}
                                    onClick={showlessIduPage}
                                    actions={<IoArrowUp />}
                                    variant="transparent"
                                >
                                    Show Less
                                </Button>
                            )}
                        </div>
                        <div>
                            Hover over and click on the coloured bubbles to see near real-time
                            snapshots of situations of internal displacement.
                        </div>
                        {iduWidget}
                    </div>
                </>
            )}
        </section>
    );
}
export default IduWidget;

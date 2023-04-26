import React, { memo, useMemo, useCallback } from 'react';
import {
    _cs,
    compareNumber,
} from '@togglecorp/fujs';
import {
    RawButton,
    Modal,
    List,
} from '@togglecorp/toggle-ui';
import { IoExitOutline } from 'react-icons/io5';

import ProgressLine from '#components/ProgressLine';
import TextOutput from '#components/TextOutput';
import useModalState from '#hooks/useModalState';
import NumberBlock from '#components/NumberBlock';

import styles from './styles.css';

interface HazardData {
    id: string;
    icon: React.ReactNode;
    displacement: number;
    hazardName: string;
}

const hazardKeySelector = (item: HazardData) => item.id;

const hazardDummyData: HazardData[] = [
    {
        id: '1',
        icon: <IoExitOutline />,
        displacement: 1000000,
        hazardName: 'Flood',
    },
    {
        id: '2',
        icon: <IoExitOutline />,
        displacement: 2000000,
        hazardName: 'Earthquake',
    },
    {
        id: '3',
        icon: <IoExitOutline />,
        displacement: 5000000,
        hazardName: 'Landslide',
    },
];

export type Props = {
    className?: string;
    title?: string;
    label: React.ReactNode;
    eventId: string;
}

function EventTitle(props: Props) {
    const {
        className,
        label,
        title,
        eventId,
    } = props;

    const [
        isModalVisible,
        showModal,
        hideModal,
    ] = useModalState(false);

    const sortedHazards = useMemo(() => (
        hazardDummyData.sort((foo, bar) => compareNumber(foo.displacement, bar.displacement, -1))
    ), []);

    const hazardRendererParams = useCallback((_: string, hazard: HazardData) => ({
        total: sortedHazards[0]?.displacement,
        value: hazard.displacement,
        icon: hazard.icon,
        title: 'Internal Displacement',
    }), [sortedHazards]);

    const event = {
        title: 'Typhoon Rai (Locally known as Odette)',
        affectedCountries: [
            {
                iso3: 'PHL',
                countryName: 'Phillipines',
            },
            {
                iso3: 'PAL',
                countryName: 'Palau',
            },
            {
                iso3: 'VNM',
                countryName: 'Viet Nam',
            },
        ],
        hazardSubTypes: [
            {
                id: '1',
                title: 'Typhoon',
            },
            {
                id: '2',
                title: 'Hurricane',
            },
            {
                id: '3',
                title: 'Cyclone',
            },
        ],
        startDate: '11/12/2021',
        endDate: '21/12/2021',
        glideNo: '1231298a',
    };

    return (
        <>
            {!eventId ? (
                label
            ) : (
                <RawButton
                    name={undefined}
                    className={_cs(className, styles.button)}
                    onClick={showModal}
                    title="Show event details"
                >
                    {label}
                </RawButton>
            )}
            {isModalVisible && (
                <Modal
                    className={styles.modal}
                    heading={title}
                    size="large"
                    onClose={hideModal}
                    bodyClassName={styles.content}
                >
                    <div className={styles.left}>
                        <NumberBlock
                            label="Internal Displacements"
                            size="medium"
                            value={4000000}
                            abbreviated={false}
                        />
                        <TextOutput
                            label="Event Name"
                            value={event.title}
                            displayType="block"
                        />
                        <TextOutput
                            label="Affected Countries"
                            value={event.affectedCountries?.map((country) => country.countryName).join(', ')}
                            displayType="block"
                        />
                        <TextOutput
                            label="Hazard Subtypes"
                            value={event.hazardSubTypes?.map((country) => country.title).join('/')}
                            displayType="block"
                        />
                        <TextOutput
                            label="Start Date"
                            value={event.startDate}
                            displayType="block"
                        />
                        <TextOutput
                            label="End Date"
                            value={event.endDate}
                            displayType="block"
                        />
                        <TextOutput
                            label="Glide No"
                            value={event.glideNo}
                            displayType="block"
                        />
                    </div>
                    <div className={styles.border} />
                    <div className={styles.right}>
                        <List
                            rendererParams={hazardRendererParams}
                            renderer={ProgressLine}
                            keySelector={hazardKeySelector}
                            data={sortedHazards}
                        />
                    </div>
                </Modal>
            )}
        </>
    );
}

export default memo(EventTitle);

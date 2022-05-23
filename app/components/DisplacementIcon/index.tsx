import React from 'react';

import ConflictIcon from '../../resources/icons/Icon_Conflict-Conflict.svg';
import DroughtIcon from '../../resources/icons/Icon_Disaster-Drought.svg';
import DryMassMovementIcon from '../../resources/icons/Icon_Disaster-Dry_Mass_Movements.svg';
import EarthquakeIcon from '../../resources/icons/Icon_Disaster-Earthquake.svg';
import ExtremeTemperatureIcon from '../../resources/icons/Icon_Disaster-Extreme_Temperature.svg';
import FloodIcon from '../../resources/icons/Icon_Disaster-Flood.svg';
import MassMovementIcon from '../../resources/icons/Icon_Disaster-Mass_Movement.svg';
import SevereWinterConditionsIcon from '../../resources/icons/Icon_Disaster-Sever_Winter_Conditions.svg';
import StormIcon from '../../resources/icons/Icon_Disaster-Storm.svg';
import VolcanicActivityIcon from '../../resources/icons/Icon_Disaster-Volcanic_Activity.svg';
import VolcanicEruptionIcon from '../../resources/icons/Icon_Disaster-Volcanic_Eruption.svg';
import WetMassMovementIcon from '../../resources/icons/Icon_Disaster-Wet_Mass_Movements.svg';
import WildfireIcon from '../../resources/icons/Icon_Disaster-Wildfire.svg';
import OtherIcon from '../../resources/icons/Icon_Other.svg';

const disasterMap: { [key: string]: string } = {
    // Disaster type we get from helix
    Storm: StormIcon,
    Flood: FloodIcon,
    Earthquake: EarthquakeIcon,
    Drought: DroughtIcon,
    'Wet mass movement': WetMassMovementIcon,
    Wildfire: WildfireIcon,
    'Dry mass movement': DryMassMovementIcon,
    'Volcanic eruption': VolcanicEruptionIcon,
    'Extreme temperature': ExtremeTemperatureIcon,

    // Disaster type we have on gidd but did not get from helix
    'Mass movement': MassMovementIcon,
    'Severe winter condition': SevereWinterConditionsIcon,
    'Volcanic activity': VolcanicActivityIcon,

    Unknown: OtherIcon,
};

function getIcon(
    displacementType: string | undefined | null,
    disasterType: string | undefined | null,
) {
    if (displacementType === 'Conflict') {
        return ConflictIcon;
    }
    if (displacementType === 'Disaster' && disasterType) {
        return disasterMap[disasterType] ?? OtherIcon;
    }
    return OtherIcon;
}

interface Props {
    className?: string;
    displacementType: string | null | undefined;
    disasterType: string | null | undefined;
}

function DisplacementIcon(props: Props) {
    const {
        className,
        displacementType,
        disasterType,
    } = props;

    return (
        <img
            className={className}
            src={getIcon(displacementType, disasterType)}
            alt="type"
        />
    );
}

export default DisplacementIcon;

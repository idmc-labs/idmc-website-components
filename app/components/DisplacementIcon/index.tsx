import React from 'react';

import ConflictIcon from '../../resources/icons/Icon_Conflict-Conflict.svg';
import DroughtIcon from '../../resources/icons/Icon_Disaster-Drought.svg';
import EarthquakeIcon from '../../resources/icons/Icon_Disaster-Earthquake.svg';
import ExtremeTemperatureIcon from '../../resources/icons/Icon_Disaster-Extreme_Temperature.svg';
import FloodIcon from '../../resources/icons/Icon_Disaster-Flood.svg';
import MassMovementIcon from '../../resources/icons/Icon_Disaster-Mass_Movement.svg';
import WaveIcon from '../../resources/icons/Icon_Wave.svg';
import StormIcon from '../../resources/icons/Icon_Disaster-Storm.svg';
import VolcanicActivityIcon from '../../resources/icons/Icon_Disaster-Volcanic_Activity.svg';
import WildfireIcon from '../../resources/icons/Icon_Disaster-Wildfire.svg';
import ErosionIcon from '../../resources/icons/Icon_Erosion.svg';
import OtherIcon from '../../resources/icons/Icon_Other.svg';

const disasterMap: { [key: string]: string } = {
    Earthquake: EarthquakeIcon,
    'Wet Mass Movement': MassMovementIcon,
    'Dry Mass Movement': MassMovementIcon,
    'Volcanic activity': VolcanicActivityIcon,
    Desertification: OtherIcon,
    Drought: DroughtIcon,
    Erosion: ErosionIcon,
    Salinisation: OtherIcon,
    'Sea level Rise': OtherIcon,
    Wildfire: WildfireIcon,
    Flood: FloodIcon,
    // NOTE: we have two different mass movement
    // 'Mass Movement': MassMovementIcon,
    'Wave action': WaveIcon,
    'Extreme Temperature': ExtremeTemperatureIcon,
    Storm: StormIcon,
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

import React, { FC, ChangeEvent } from 'react';

import Range from '../Range';

interface IProps {
  changeVolume: (volume: number) => void;
  volume: number;
}

const VolumeControl: FC<IProps> = ({ changeVolume, volume }) => (
  <Range
    type="range"
    name="track"
    min="0"
    max="1"
    step="0.01"
    aria-label="volume control"
    value={volume}
    onChange={(e: ChangeEvent<HTMLInputElement>) => changeVolume(parseFloat(e.target.value))}
  />
);

export default VolumeControl;

import React, { FC, ChangeEvent } from 'react';

import Range from '../Range';

interface IProps {
  duration: number;
  isRadio: boolean;
  currentTime: number;
  seek: (time: number) => void;
}

const getCorrectValue = (isRadio: boolean, time: number) => (isRadio || isNaN(time) || time === Infinity ? 0 : time);

const Progress: FC<IProps> = ({ isRadio, duration, currentTime, seek }) => (
  <Range
    type="range"
    name="track"
    aria-label="progress"
    min="0"
    step="0.01"
    onChange={(e: ChangeEvent<HTMLInputElement>) => seek(parseInt(e.target.value))}
    value={getCorrectValue(isRadio, currentTime)}
    max={getCorrectValue(isRadio, duration)}
    disabled={isRadio}
  />
);

export default Progress;

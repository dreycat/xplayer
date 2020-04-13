import React, { FC } from 'react';
import classNames from 'classnames/bind';

import styles from './Window.module.css';

const cx = classNames.bind(styles);

interface IProps {
  label: string;
  className?: string;
}

const Window: FC<IProps> = ({ label, children, className }) => (
  <div className={cx('main', className)}>
    <div className={styles.header}>
      <h2 className={styles.name}>{label}</h2>
      <div className={styles.decor} />
      <button className={styles.close} />
    </div>
    <div className={styles.body}>{children}</div>
  </div>
);

export default Window;

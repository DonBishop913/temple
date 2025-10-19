import React from 'react';
import PropTypes from 'prop-types';
import { useSocket } from '../hooks/useSocket';

const BurdenTimeline = ({ events = [] }) => {
  const { socketData = [] } = useSocket('dashboard-update') || {};
  const merged = [...events, ...socketData].slice(-200);

  return (
    <div className="timeline">
      {merged.map((evt, index) => (
        <div key={evt.id || index} className="timeline-event">
          <span className="ts">{evt.timestamp || evt.time || ''}</span>
          <span className="msg">: {evt.message || evt.msg || JSON.stringify(evt)}</span>
        </div>
      ))}
    </div>
  );
};

BurdenTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      timestamp: PropTypes.string,
      message: PropTypes.string
    })
  )
};

export default BurdenTimeline;


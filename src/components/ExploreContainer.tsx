import React from 'react';
import './ExploreContainer.css';

var QRCode = require('qrcode')

interface ContainerProps {
}

const ExploreContainer: React.FC<ContainerProps> = () => {
  return (
    <div className="container">

      <div className="border">

          <div id="canvas">

          </div>

      </div>
    </div>
  );
};

export default ExploreContainer;

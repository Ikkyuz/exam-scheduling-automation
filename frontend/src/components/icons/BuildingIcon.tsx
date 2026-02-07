import React from 'react';

const BuildingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" {...props}>
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M8.25 21V3.612A2.25 2.25 0 0 0 6 1.5a2.25 2.25 0 0 0-2.25 2.25v17.25m15.75-1.5V5.25a2.25 2.25 0 0 0-2.25-2.25a2.25 2.25 0 0 0-2.25 2.25v17.25m-6-1.5V3.612A2.25 2.25 0 0 0 9.75 1.5a2.25 2.25 0 0 0-2.25 2.25v17.25" />
    </svg>
);

export default BuildingIcon;

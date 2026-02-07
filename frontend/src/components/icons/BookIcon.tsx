import React from 'react';

const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3.002.519C1.067 4.411 0 5.771 0 7.153v10.128a2.25 2.25 0 002.25 2.25h15.5c1.24 0 2.25-1.01 2.25-2.25V7.153c0-1.382-1.067-2.742-2.998-3.419A8.967 8.967 0 0012 3.75c-1.052 0-2.062.18-3.002.519C7.067 4.411 6 5.771 6 7.153v10.128a2.25 2.25 0 002.25 2.25h15.5c1.24 0 2.25-1.01 2.25-2.25V7.153c0-1.382-1.067-2.742-2.998-3.419A8.967 8.967 0 0012 3.75z" />
    </svg>
);

export default BookIcon;

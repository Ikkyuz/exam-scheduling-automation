import React from 'react';

interface TableProps {
    headers: string[];
    children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ headers, children }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 table-fixed md:table-auto">
                    <thead className="bg-blue-50">
                        <tr>
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    scope="col"
                                    className="px-3 md:px-6 py-4 md:py-5 text-left font-black text-slate-800 uppercase tracking-tight whitespace-normal break-words border-b border-slate-200"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;

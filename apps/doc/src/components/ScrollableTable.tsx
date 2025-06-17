import React from 'react';

interface ScrollableTableProps {
  children: React.ReactNode;
  maxHeight?: string;
}

const ScrollableTable: React.FC<ScrollableTableProps> = ({ 
  children, 
  maxHeight = '400px' 
}) => {
  return (
    <>
      <style>
        {`
          .scrollable-table table {
            max-height: ${maxHeight};
            overflow-y: auto;
          }
          .scrollable-table thead {
            position: sticky;
            top: 0;
            background: white;
            z-index: 1;
          }
        `}
      </style>
      <div className="scrollable-table">
        {children}
      </div>
    </>
  );
};

export default ScrollableTable;
import React from 'react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({ value, onChange, placeholder }) => (
  <div className="topbar-search-wrap mb-3" style={{ width: '100%' }}>
    <input
      type="text"
      className="topbar-search-input"
      placeholder={placeholder}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
    <i className="bi bi-search topbar-search-icon"></i>
  </div>
);

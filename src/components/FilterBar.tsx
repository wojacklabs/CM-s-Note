import './FilterBar.css';

interface FilterBarProps {
  cms: string[];
  userTypes: string[];
  icons: { url: string; name: string }[];
  selectedCM: string;
  selectedUserType: string;
  selectedIcon: string;
  onCMChange: (cm: string) => void;
  onUserTypeChange: (userType: string) => void;
  onIconChange: (icon: string) => void;
}

function FilterBar({
  cms,
  userTypes,
  icons,
  selectedCM,
  selectedUserType,
  selectedIcon,
  onCMChange,
  onUserTypeChange,
  onIconChange
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="cm-filter">CM:</label>
        <select
          id="cm-filter"
          value={selectedCM}
          onChange={(e) => onCMChange(e.target.value)}
        >
          <option value="all">All CMs</option>
          {cms.map(cm => (
            <option key={cm} value={cm}>
              {cm}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="usertype-filter">User Type:</label>
        <select
          id="usertype-filter"
          value={selectedUserType}
          onChange={(e) => onUserTypeChange(e.target.value)}
        >
          <option value="all">All Types</option>
          {userTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="icon-filter">Icon:</label>
        <select
          id="icon-filter"
          value={selectedIcon}
          onChange={(e) => onIconChange(e.target.value)}
          className="icon-select"
        >
          <option value="all">All Icons</option>
          {icons.map((icon, index) => (
            <option key={`${icon.url}-${index}`} value={icon.url}>
              Icon {index + 1}
            </option>
          ))}
        </select>
        {selectedIcon !== 'all' && (
          <img 
            src={selectedIcon} 
            alt="Selected icon" 
            className="selected-icon-preview"
          />
        )}
      </div>
    </div>
  );
}

export default FilterBar; 
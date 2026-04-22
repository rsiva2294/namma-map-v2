import React from 'react';
import { Search, X, Loader2, Navigation, MapPin, ShoppingBag, Zap } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

const SearchBar: React.FC = () => {
  const searchQuery = useMapStore(state => state.searchQuery);
  const setSearchQuery = useMapStore(state => state.setSearchQuery);
  const activeLayer = useMapStore(state => state.activeLayer);
  const isResolving = useMapStore(state => state.isResolving);
  const isLocating = useMapStore(state => state.isLocating);
  const setTriggerLocateMe = useMapStore(state => state.setTriggerLocateMe);
  const clearSearch = useMapStore(state => state.clearSearch);
  const searchSuggestions = useMapStore(state => state.searchSuggestions);
  const setSearchSuggestions = useMapStore(state => state.setSearchSuggestions);
  const setSelectedSuggestion = useMapStore(state => state.setSelectedSuggestion);

  return (
    <header className="floating-search-container">
      <div className="glass search-bar">
        <Search size={20} color="var(--text-secondary)" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isLocating ? "Locating you..." :
            activeLayer === 'TNEB' ? "Search Pincodes or Section Names..." : 
            "Search Pincodes or Areas..."
          }
          className="search-input"
        />
        {isResolving && <Loader2 className="animate-spin" size={18} color="var(--accent)" style={{ marginRight: '10px' }} />}
        {searchQuery && (
          <X 
            size={18} 
            color="var(--text-secondary)" 
            className="search-action-icon"
            onClick={clearSearch} 
          />
        )}
        {isLocating ? (
          <Loader2 className="animate-spin" size={18} color="var(--accent)" />
        ) : (
          <Navigation 
            size={18} 
            color="var(--accent)" 
            className="search-action-icon"
            onClick={() => setTriggerLocateMe(true)}
          />
        )}
      </div>
      
      {/* Dropdown Suggestions */}
      {searchSuggestions.length > 0 && (
        <ul className="glass search-suggestions">
          {searchSuggestions.map((suggestion, idx) => {
            let title = '';
            let subtitle = '';
            let Icon = MapPin;

            if (suggestion.suggestionType === 'PDS_SHOP') {
              title = suggestion.properties.shop_code;
              subtitle = `${suggestion.properties.name} - ${suggestion.properties.village}`;
              Icon = ShoppingBag;
            } else if (suggestion.suggestionType === 'TNEB_SECTION') {
              title = suggestion.properties.section_na || suggestion.properties.section_office;
              subtitle = `TNEB Section - ${suggestion.properties.circle_nam || ''}`;
              Icon = Zap;
            } else {
              const name = suggestion.properties.office_name || suggestion.properties.district || suggestion.properties.NAME || '';
              const pin = suggestion.properties.PIN_CODE || suggestion.properties.pincode;
              title = pin ? `${pin} - ${name}` : name;
              subtitle = suggestion.properties.district ? `${suggestion.properties.district} District` : 'Area Boundary';
              Icon = MapPin;
            }
            
            return (
              <li
                key={idx}
                className="suggestion-item"
                onClick={() => {
                  setSearchQuery(title);
                  setSelectedSuggestion(suggestion);
                  setSearchSuggestions([]);
                }}
              >
                <Icon size={16} color="var(--text-secondary)" />
                <div className="suggestion-text">
                  <span className="suggestion-title">{title}</span>
                  <span className="suggestion-subtitle">{subtitle}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
};

export default SearchBar;

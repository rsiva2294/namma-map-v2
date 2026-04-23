import React from 'react';
import { Search, X, Loader2, Navigation, MapPin, ShoppingCart, Zap, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';

const SearchBar: React.FC = () => {
  const searchQuery = useMapStore(state => state.searchQuery);
  const setSearchQuery = useMapStore(state => state.setSearchQuery);
  const isResolving = useMapStore(state => state.isResolving);
  const isLocating = useMapStore(state => state.isLocating);
  const setTriggerLocateMe = useMapStore(state => state.setTriggerLocateMe);
  const clearSearch = useMapStore(state => state.clearSearch);
  const searchSuggestions = useMapStore(state => state.searchSuggestions);
  const setSearchSuggestions = useMapStore(state => state.setSearchSuggestions);
  const setSelectedSuggestion = useMapStore(state => state.setSelectedSuggestion);
  const setUserTyping = useMapStore(state => state.setUserTyping);

  return (
    <header className="floating-search-container" role="search">
      <div className="glass search-bar">
        <Search size={20} color="var(--text-secondary)" aria-hidden="true" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => {
            setUserTyping(true);
            setSearchQuery(e.target.value);
          }}
          placeholder={
            isLocating ? "Locating you..." :
            "Search Districts, Pincodes, or Offices..."
          }
          className="search-input"
          aria-label="Search for a location"
          aria-autocomplete="list"
        />
        {isResolving && <Loader2 className="animate-spin" size={18} color="var(--accent)" style={{ marginRight: '10px' }} />}
        {searchQuery && (
          <button 
            className="suggestion-action-btn"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X size={18} color="var(--text-secondary)" />
          </button>
        )}
        <button 
          className="suggestion-action-btn"
          onClick={() => setTriggerLocateMe(true)}
          aria-label="Locate me"
          disabled={isLocating}
        >
          {isLocating ? (
            <Loader2 className="animate-spin" size={18} color="var(--accent)" />
          ) : (
            <Navigation 
              size={18} 
              color="var(--accent)" 
            />
          )}
        </button>
      </div>
      
      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {searchSuggestions.length > 0 && (
          <motion.ul 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass search-suggestions"
            role="listbox"
          >
            {searchSuggestions.map((suggestion, idx) => {
              let title = '';
              let subtitle = '';
              let Icon = MapPin;
              let iconColor = 'var(--text-secondary)';

              if (suggestion.suggestionType === 'PDS_SHOP') {
                title = suggestion.properties.shop_code as string;
                subtitle = `${suggestion.properties.name} - ${suggestion.properties.taluk || ''}`;
                Icon = ShoppingCart;
                iconColor = '#ef4444';
              } else if (suggestion.suggestionType === 'TNEB_SECTION') {
                title = (suggestion.properties.section_na || suggestion.properties.section_office || '') as string;
                subtitle = `TNEB Section - ${suggestion.properties.circle_nam || ''}`;
                Icon = Zap;
                iconColor = '#f59e0b';
              } else if (suggestion.suggestionType === 'DISTRICT') {
                title = (suggestion.properties.district || suggestion.properties.DISTRICT || suggestion.properties.NAME || '') as string;
                subtitle = 'District Boundary';
                Icon = Building2;
                iconColor = '#64748b';
              } else {
                const name = (suggestion.properties.office_name || suggestion.properties.district || suggestion.properties.NAME || '').toString();
                const pin = (suggestion.properties.PIN_CODE || suggestion.properties.pincode)?.toString();
                title = pin ? `${pin} - ${name}` : name;
                subtitle = suggestion.properties.district ? `${suggestion.properties.district} District` : 'Area Boundary';
                Icon = MapPin;
                iconColor = '#3b82f6';
              }
              
              return (
                <li
                  key={idx}
                  className="suggestion-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => {
                    setUserTyping(false);
                    setSearchQuery(title);
                    setSelectedSuggestion(suggestion);
                    setSearchSuggestions([]);
                  }}
                >
                  <Icon size={16} color={iconColor} aria-hidden="true" />
                  <div className="suggestion-text">
                    <span className="suggestion-title">{title}</span>
                    <span className="suggestion-subtitle">{subtitle}</span>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
};

export default SearchBar;

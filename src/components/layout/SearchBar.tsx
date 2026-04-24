import React from 'react';
import { Search, X, Loader2, Navigation, MapPin, ShoppingCart, Zap, Building2, Landmark, Shield, Activity } from 'lucide-react';
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
  const focusedSuggestionIndex = useMapStore(state => state.focusedSuggestionIndex);
  const setFocusedSuggestionIndex = useMapStore(state => state.setFocusedSuggestionIndex);
  const setUserTyping = useMapStore(state => state.setUserTyping);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex((focusedSuggestionIndex + 1) % searchSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex((focusedSuggestionIndex - 1 + searchSuggestions.length) % searchSuggestions.length);
    } else if (e.key === 'Enter') {
      if (focusedSuggestionIndex >= 0) {
        const suggestion = searchSuggestions[focusedSuggestionIndex];
        setUserTyping(false);
        setSelectedSuggestion(suggestion);
        setSearchSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setSearchSuggestions([]);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <strong key={i} style={{ color: 'var(--accent)', fontWeight: '700' }}>{part}</strong> 
        : part
    );
  };

  // Group suggestions by type
  const groupedSuggestions = searchSuggestions.reduce((acc, curr) => {
    const type = curr.suggestionType || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(curr);
    return acc;
  }, {} as Record<string, typeof searchSuggestions>);

  const categoryLabels: Record<string, string> = {
    'POLICE_STATION': 'Police Stations',
    'TNEB_SECTION': 'TNEB Sections',
    'PINCODE': 'Areas & Pincodes',
    'DISTRICT': 'Districts',
    'PDS_SHOP': 'PDS Shops',
    'CONSTITUENCY': 'Constituencies',
    'OTHER': 'Other'
  };

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
            setFocusedSuggestionIndex(-1);
          }}
          onKeyDown={handleKeyDown}
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
            {Object.entries(groupedSuggestions).map(([type, items]) => (
              <React.Fragment key={type}>
                <div className="suggestion-category-header">
                  {categoryLabels[type] || type}
                </div>
                {items.map((suggestion) => {
                  const globalIdx = searchSuggestions.indexOf(suggestion);
                  const isFocused = globalIdx === focusedSuggestionIndex;

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
                  } else if (suggestion.suggestionType === 'CONSTITUENCY') {
                    const isPc = !!suggestion.properties.parliame_1 && !suggestion.properties.assembly_c;
                    const num = suggestion.properties.assembly_1 || suggestion.properties.parliament;
                    title = (suggestion.properties.assembly_c || suggestion.properties.parliame_1 || 'Constituency') as string;
                    subtitle = isPc ? `PC #${num} - Parliamentary Constituency` : `AC #${num} - Assembly Constituency (${suggestion.properties.parliame_1})`;
                    Icon = Landmark;
                    iconColor = '#4f46e5';
                  } else if (suggestion.suggestionType === 'POLICE_STATION') {
                    title = (suggestion.properties.ps_name || '') as string;
                    subtitle = 'Police Station';
                    Icon = Shield;
                    iconColor = '#334155';
                  } else if (suggestion.suggestionType === 'HEALTH_FACILITY') {
                    title = (suggestion.properties.facility_n || '') as string;
                    subtitle = `Health Facility - ${suggestion.properties.facility_t || ''}`;
                    Icon = Activity;
                    iconColor = '#f43f5e';
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
                      key={globalIdx}
                      className={`suggestion-item ${isFocused ? 'focused' : ''}`}
                      role="option"
                      aria-selected={isFocused}
                      onMouseEnter={() => setFocusedSuggestionIndex(globalIdx)}
                      onClick={() => {
                        setUserTyping(false);
                        setSelectedSuggestion(suggestion);
                        setSearchSuggestions([]);
                      }}
                    >
                      <Icon size={16} color={iconColor} aria-hidden="true" />
                      <div className="suggestion-text">
                        <span className="suggestion-title">{highlightMatch(title, searchQuery)}</span>
                        <span className="suggestion-subtitle">{subtitle}</span>
                      </div>
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
};

export default SearchBar;

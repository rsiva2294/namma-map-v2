import React from 'react';
import { Search, X, Loader2, Navigation, MapPin, ShoppingCart, Zap, Building2, Landmark, Shield, Activity, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import { trackEvent } from '../../lib/firebase';
import { useTranslation } from '../../i18n/translations';

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
  const { t } = useTranslation();

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
        trackEvent('search_suggestion_select', { 
          suggestion_type: suggestion.suggestionType,
          query: searchQuery 
        });
        setSelectedSuggestion(suggestion);
        setSearchSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setSearchSuggestions([]);
    }
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const escapedQuery = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <strong key={i} style={{ color: 'var(--accent)', fontWeight: '700' }}>{part}</strong> 
        : part
    );
  };

  const activeLayer = useMapStore(state => state.activeLayer);
  const groupedSuggestions = searchSuggestions.reduce((acc, curr) => {
    const type = (curr.suggestionType || 'OTHER').toString();
    const safeType = type.trim() || 'OTHER';
    if (!acc[safeType]) acc[safeType] = [];
    acc[safeType].push(curr);
    return acc;
  }, {} as Record<string, typeof searchSuggestions>);

  const categoryLabels: Record<string, string> = {
    'POLICE_STATION': t('CAT_POLICE'),
    'TNEB_SECTION': t('CAT_TNEB'),
    'PINCODE': t('CAT_PINCODE'),
    'DISTRICT': t('CAT_DISTRICT'),
    'PDS_SHOP': t('CAT_PDS'),
    'CONSTITUENCY': t('CAT_CONSTITUENCY'),
    'HEALTH_FACILITY': t('CAT_HEALTH'),
    'COORDINATES': t('CAT_COORDINATES'),
    'GLOBAL_PLACE': t('CAT_GLOBAL'),
    'OTHER': t('CAT_OTHER')
  };

  return (
    <header className="floating-search-container" role="search">
      <div className="glass search-bar">
        <Search size={20} color="var(--text-secondary)" aria-hidden="true" />
        <input 
          type="text" 
          id="main-search-input"
          name="search"
          value={searchQuery}
          onChange={(e) => {
            setUserTyping(true);
            setSearchQuery(e.target.value);
            setFocusedSuggestionIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isLocating ? t('LOCATING') :
            activeLayer === 'HEALTH' ? t('SEARCH_HEALTH') :
            activeLayer === 'PDS' ? t('SEARCH_PDS') :
            activeLayer === 'TNEB' ? t('SEARCH_TNEB') :
            activeLayer === 'POLICE' ? t('SEARCH_POLICE') :
            activeLayer === 'CONSTITUENCY' ? t('SEARCH_CONSTITUENCY') :
            t('SEARCH_PLACEHOLDER')
          }
          className="search-input"
          aria-label={t('SEARCH_FOR_LOCATION')}
          aria-autocomplete="list"
        />
        {isResolving && <Loader2 className="animate-spin" size={18} color="var(--accent)" style={{ marginRight: '10px' }} />}
        {searchQuery && (
          <button 
            className="suggestion-action-btn"
            onClick={clearSearch}
            aria-label={t('CLEAR_SEARCH')}
          >
            <X size={18} color="var(--text-secondary)" />
          </button>
        )}
        <button 
          className="suggestion-action-btn"
          onClick={() => {
            trackEvent('locate_me_click');
            setTriggerLocateMe(true);
          }}
          aria-label={t('LOCATE_ME_ARIA')}
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
            transition={{ duration: 0.2 }}
            className="glass search-suggestions"
            role="listbox"
          >
            {Object.entries(groupedSuggestions).map(([type, items], groupIdx) => (
              <React.Fragment key={`suggestion-group-${type || groupIdx}`}>
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
                    iconColor = 'var(--error)';
                  } else if (suggestion.suggestionType === 'TNEB_SECTION') {
                    title = (suggestion.properties.section_na || suggestion.properties.section_office || '') as string;
                    subtitle = `TNEB Section - ${suggestion.properties.circle_nam || ''}`;
                    Icon = Zap;
                    iconColor = 'var(--revenue-amber)';
                  } else if (suggestion.suggestionType === 'DISTRICT') {
                    title = (suggestion.properties.district || suggestion.properties.DISTRICT || suggestion.properties.NAME || '') as string;
                    subtitle = t('SUB_DISTRICT_BOUNDARY');
                    Icon = Building2;
                    iconColor = 'var(--on-surface-variant)';
                  } else if (suggestion.suggestionType === 'CONSTITUENCY') {
                    const isPc = !!suggestion.properties.parliame_1 && !suggestion.properties.assembly_c;
                    const num = suggestion.properties.assembly_1 || suggestion.properties.parliament;
                    title = (suggestion.properties.assembly_c || suggestion.properties.parliame_1 || 'Constituency') as string;
                    subtitle = isPc ? `PC #${num} - ${t('SUB_PC')}` : `AC #${num} - ${t('SUB_AC')} (${suggestion.properties.parliame_1})`;
                    Icon = Landmark;
                    iconColor = 'var(--transport-indigo)';
                  } else if (suggestion.suggestionType === 'POLICE_STATION') {
                    title = (suggestion.properties.ps_name || '') as string;
                    subtitle = t('SUB_POLICE');
                    Icon = Shield;
                    iconColor = 'var(--police-slate)';
                  } else if (suggestion.suggestionType === 'HEALTH_FACILITY') {
                    const typeLabel = (suggestion.properties.facility_t && t(suggestion.properties.facility_t as any)) || String(suggestion.properties.facility_t || t('HEALTH'));
                    
                    title = (suggestion.properties.facility_n || '') as string;
                    subtitle = `${typeLabel} • ${suggestion.properties.district_n || suggestion.properties.district || ''} • ${suggestion.properties.block_name || t('SUB_LOCAL_AREA')}`;
                    Icon = Activity;
                    iconColor = 'var(--health-rose)';
                  } else if (suggestion.suggestionType === 'COORDINATES') {
                    title = t('GO_TO_COORDINATES');
                    subtitle = (suggestion.properties.name || '') as string;
                    Icon = Navigation;
                    iconColor = 'var(--primary)';
                  } else if (suggestion.suggestionType === 'GLOBAL_PLACE') {
                    title = (suggestion.properties.main_text || suggestion.properties.name || '') as string;
                    subtitle = (suggestion.properties.secondary_text || t('CAT_GLOBAL')) as string;
                    Icon = Globe;
                    iconColor = '#10b981';
                  } else {
                    const name = (suggestion.properties.office_name || suggestion.properties.district || suggestion.properties.NAME || '').toString();
                    const pin = (suggestion.properties.PIN_CODE || suggestion.properties.pincode)?.toString();
                    title = pin ? `${pin} - ${name}` : name;
                    subtitle = suggestion.properties.district ? `${suggestion.properties.district} ${t('DISTRICT')}` : t('SUB_AREA_BOUNDARY');
                    Icon = MapPin;
                    iconColor = 'var(--primary)';
                  }
                  
                  return (
                    <li
                      key={`suggestion-${suggestion.properties.place_id || suggestion.properties.ps_code || suggestion.properties.shop_code || suggestion.properties.nin_number || globalIdx}`}
                      className={`suggestion-item ${isFocused ? 'focused' : ''}`}
                      role="option"
                      aria-selected={isFocused}
                      onMouseEnter={() => setFocusedSuggestionIndex(globalIdx)}
                      onClick={() => {
                        setUserTyping(false);
                        trackEvent('search_suggestion_select', { 
                          suggestion_type: suggestion.suggestionType,
                          query: searchQuery 
                        });
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

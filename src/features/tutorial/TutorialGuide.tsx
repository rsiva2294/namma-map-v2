import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useMapStore } from '../../store/useMapStore';
import { useTranslation } from '../../i18n/translations';

const TutorialGuide = () => {
  const { t, language } = useTranslation();
  const hasSeenTutorial = useMapStore(state => state.hasSeenTutorial);
  const setHasSeenTutorial = useMapStore(state => state.setHasSeenTutorial);
  const isTutorialOpen = useMapStore(state => state.isTutorialOpen);
  const setIsTutorialOpen = useMapStore(state => state.setIsTutorialOpen);

  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      nextBtnText: language === 'ta' ? 'அடுத்து' : 'Next',
      prevBtnText: language === 'ta' ? 'முந்தையது' : 'Previous',
      doneBtnText: language === 'ta' ? 'முடிந்தது' : 'Done',
      onDestroyed: () => {
        setHasSeenTutorial(true);
        setIsTutorialOpen(false);
      },
      steps: [
        { 
          popover: { 
            title: t('TUTORIAL_WELCOME_TITLE'), 
            description: t('TUTORIAL_WELCOME_DESC'),
            align: 'center'
          } 
        },
        { 
          element: '.sidebar', 
          popover: { 
            title: t('TUTORIAL_LAYERS_TITLE'), 
            description: t('TUTORIAL_LAYERS_DESC'),
            side: "right",
            align: 'start'
          } 
        },
        { 
          element: '.search-bar', 
          popover: { 
            title: t('TUTORIAL_SEARCH_TITLE'), 
            description: t('TUTORIAL_SEARCH_DESC'),
            side: "bottom",
            align: 'center'
          } 
        },
        { 
          element: '[aria-label="Locate me"]', 
          popover: { 
            title: t('TUTORIAL_LOCATE_TITLE'), 
            description: t('TUTORIAL_LOCATE_DESC'),
            side: "bottom",
            align: 'center'
          } 
        },
        { 
          element: '.leaflet-container', 
          popover: { 
            title: t('TUTORIAL_MAP_TITLE'), 
            description: t('TUTORIAL_MAP_DESC'),
            side: "left",
            align: 'center'
          } 
        }
      ]
    });

    if (isTutorialOpen || !hasSeenTutorial) {
      // Delay slightly to ensure layout is settled
      const timer = setTimeout(() => {
        driverObj.drive();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTutorialOpen, hasSeenTutorial, setIsTutorialOpen, setHasSeenTutorial, t, language]);

  return null;
};

export default TutorialGuide;

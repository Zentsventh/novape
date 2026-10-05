import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'novape.location.v1';
const EMPTY_LOCATION = { departamento: '', provincia: '', distrito: '' };

const normalizeLocation = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...EMPTY_LOCATION };
  const normalized = Object.fromEntries(Object.keys(EMPTY_LOCATION).map((key) => [
    key, typeof value[key] === 'string' ? value[key].trim() : '',
  ]));
  return Object.values(normalized).every((item) => item && item.length <= 200)
    ? normalized : { ...EMPTY_LOCATION };
};

const readLocation = () => {
  try {
    return normalizeLocation(JSON.parse(window.localStorage.getItem(STORAGE_KEY)));
  } catch {
    return { ...EMPTY_LOCATION };
  }
};

// Context to share user's selected location across the app
const LocationContext = createContext({
  location: EMPTY_LOCATION,
  setLocation: () => {}
});

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(readLocation);
  const setLocation = useCallback((value) => {
    const next = normalizeLocation(value);
    // Write immediately so a reload or full navigation cannot outrun an effect.
    try {
      if (next.distrito) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Browsers that restrict storage still keep the selection for this visit.
    }
    setLocationState(next);
  }, []);

  useEffect(() => {
    const syncLocation = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setLocationState(readLocation());
    };
    window.addEventListener('storage', syncLocation);
    return () => window.removeEventListener('storage', syncLocation);
  }, []);
  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);

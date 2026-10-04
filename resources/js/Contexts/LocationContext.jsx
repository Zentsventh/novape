import React, { createContext, useContext, useState } from 'react';

// Context to share user's selected location across the app
const LocationContext = createContext({
  location: { departamento: '', provincia: '', distrito: '' },
  setLocation: () => {}
});

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({ departamento: '', provincia: '', distrito: '' });
  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);

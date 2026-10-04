import React, { createContext, useContext, useState } from 'react';

// Context to share shipping cost across the app
const ShippingContext = createContext({
  shipping: { costo: 0, peso_total: 0, courier: '' },
  setShipping: () => {}
});

export const ShippingProvider = ({ children }) => {
  const [shipping, setShipping] = useState({ costo: 0, peso_total: 0, courier: '' });
  return (
    <ShippingContext.Provider value={{ shipping, setShipping }}>
      {children}
    </ShippingContext.Provider>
  );
};

export const useShipping = () => useContext(ShippingContext);

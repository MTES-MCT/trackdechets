import { useState } from "react";

function useLocalStorage(key) {
  // State to store  value

  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return ""
      return item ? JSON.parse(item) : "";
    } catch (error) {
      // If error return ""
      return "";
    }
  });

  // Wrap useState's setter function that persists the new value to localStorage
  const setValue = value => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToPersist =
        value instanceof Function ? value(storedValue) : value;
      // Set react state
      setStoredValue(valueToPersist);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToPersist));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;

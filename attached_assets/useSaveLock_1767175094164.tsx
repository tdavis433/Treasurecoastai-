import { useState, useRef, createContext, useContext } from "react";

interface SaveLockContextType {
  acquireLock: () => Promise<void>;
  releaseLock: () => void;
  isLocked: boolean;
}

const SaveLockContext = createContext<SaveLockContextType | null>(null);

function SaveLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const lockPromiseRef = useRef<Promise<void> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const acquireLock = async () => {
    while (lockPromiseRef.current) {
      await lockPromiseRef.current;
    }
    lockPromiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve;
    });
    setIsLocked(true);
  };

  const releaseLock = () => {
    setIsLocked(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
    lockPromiseRef.current = null;
  };

  return (
    <SaveLockContext.Provider value={{ acquireLock, releaseLock, isLocked }}>
      {children}
    </SaveLockContext.Provider>
  );
}

function useSaveLock() {
  const context = useContext(SaveLockContext);
  if (!context) {
    return { acquireLock: async () => {}, releaseLock: () => {}, isLocked: false };
  }
  return context;
}

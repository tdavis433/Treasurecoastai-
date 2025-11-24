import { createContext, useContext, useState, ReactNode } from "react";

interface AdminContextType {
  dateRange: string;
  setDateRange: (range: string) => void;
  getDateRangeDates: () => { startDate: Date | undefined; endDate: Date | undefined };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState("30");

  const getDateRangeDates = () => {
    const end = new Date();
    const start = new Date();

    switch (dateRange) {
      case "1":
        start.setDate(start.getDate() - 1);
        break;
      case "7":
        start.setDate(start.getDate() - 7);
        break;
      case "30":
        start.setDate(start.getDate() - 30);
        break;
      case "90":
        start.setDate(start.getDate() - 90);
        break;
      default:
        return { startDate: undefined, endDate: undefined };
    }

    return { startDate: start, endDate: end };
  };

  return (
    <AdminContext.Provider value={{ dateRange, setDateRange, getDateRangeDates }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminContext must be used within AdminProvider");
  }
  return context;
}

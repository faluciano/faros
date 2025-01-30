import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface UserContextType {
  isRegistered: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const registerUser = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        if (!token) return;

        let baseUrl = "https://faros-backend.azurewebsites.net";
        if (process.env.NODE_ENV === "development") {
          baseUrl = "http://localhost:8080";
        }

        // Call the GetUser endpoint which will create the user if they don't exist
        const response = await fetch(`${baseUrl}/user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Failed to register user:', await response.text());
        }
      } catch (error) {
        console.error('Error registering user:', error);
      }
    };

    registerUser();
  }, [isSignedIn, getToken]);

  return (
    <UserContext.Provider value={{ isRegistered: isSignedIn || false }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
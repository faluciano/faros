export const getBaseUrl = () => {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://faros-backend.azurewebsites.net";
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const headers = options.headers as Record<string, string>;
  const token = headers?.Authorization?.replace('Bearer ', '') || headers?.['Authorization']?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No auth token provided');
  }

  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  return response;
}; 
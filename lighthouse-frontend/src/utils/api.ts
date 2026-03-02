export const getBaseUrl = () => {
  return import.meta.env.DEV
    ? "http://localhost:8080"
    : "https://faros-backend.thankfulmoss-a3acc927.westus2.azurecontainerapps.io";
};

export const fetchWithAuth = async (token: string, endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getLighthouses = async () => {
  const response = await fetch(`${getBaseUrl()}/api/lighthouses`);
  if (!response.ok) {
    throw new Error('Failed to fetch lighthouses');
  }
  return response.json();
};

export const getVisitedLighthouses = (token: string) => fetchWithAuth(token, '/user/lighthouses');
export const addVisitedLighthouse = (token: string, lighthouseId: string) => fetchWithAuth(token, '/user/lighthouses', { method: 'POST', body: JSON.stringify({ lighthouseId }) });
export const removeVisitedLighthouse = (token: string, lighthouseId: string) => fetchWithAuth(token, '/user/lighthouses', { method: 'DELETE', body: JSON.stringify({ lighthouseId }) });

export const getWishlist = (token: string) => fetchWithAuth(token, '/user/wishlist');
export const addToWishlist = (token: string, lighthouseId: string) => fetchWithAuth(token, '/user/wishlist', { method: 'POST', body: JSON.stringify({ lighthouseId }) });
export const removeFromWishlist = (token: string, lighthouseId: string) => fetchWithAuth(token, '/user/wishlist', { method: 'DELETE', body: JSON.stringify({ lighthouseId }) });

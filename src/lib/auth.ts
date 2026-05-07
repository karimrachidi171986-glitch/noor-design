
export const getAuthToken = () => localStorage.getItem('noor-admin-token');
export const setAuthToken = (token: string) => localStorage.setItem('noor-admin-token', token);
export const removeAuthToken = () => localStorage.removeItem('noor-admin-token');

export const verifyAdmin = async () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch('/api/admin/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

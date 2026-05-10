const ACCESS = "collabrix_access_token";
const REFRESH = "collabrix_refresh_token";

export function setAuthTokens(accessToken, refreshToken) {
  if (accessToken) sessionStorage.setItem(ACCESS, accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH, refreshToken);
}

export function setAccessTokenOnly(accessToken) {
  if (accessToken) sessionStorage.setItem(ACCESS, accessToken);
}

export function clearAuthTokens() {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH);
}

/**
 * Error Codes Constants
 * 
 * Centralized error codes that align with backend error codes.
 * These codes are used throughout the application for consistent error handling.
 */

import { ErrorCodes, ERROR_MESSAGES } from '../types/api';

// Re-export for convenience
export { ErrorCodes, ERROR_MESSAGES };

/**
 * HTTP Status Code mappings for common error scenarios
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Maps error codes to their typical HTTP status codes
 */
export const ERROR_CODE_TO_STATUS: Record<string, number> = {
  [ErrorCodes.VALIDATION_ERROR]: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
  [ErrorCodes.AUTHENTICATION_ERROR]: HTTP_STATUS_CODES.UNAUTHORIZED,
  [ErrorCodes.AUTH_REQUIRED]: HTTP_STATUS_CODES.UNAUTHORIZED,
  [ErrorCodes.AUTHORIZATION_ERROR]: HTTP_STATUS_CODES.FORBIDDEN,
  [ErrorCodes.ACCESS_DENIED]: HTTP_STATUS_CODES.FORBIDDEN,
  [ErrorCodes.NOT_FOUND]: HTTP_STATUS_CODES.NOT_FOUND,
  [ErrorCodes.RESOURCE_NOT_FOUND]: HTTP_STATUS_CODES.NOT_FOUND,
  [ErrorCodes.NETWORK_ERROR]: 0, // Network errors don't have HTTP status
  [ErrorCodes.SERVER_ERROR]: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  [ErrorCodes.TIMEOUT_ERROR]: HTTP_STATUS_CODES.GATEWAY_TIMEOUT,
  [ErrorCodes.TENANT_ERROR]: HTTP_STATUS_CODES.BAD_REQUEST,
  [ErrorCodes.TENANT_NOT_FOUND]: HTTP_STATUS_CODES.NOT_FOUND,
  [ErrorCodes.TENANT_INACTIVE]: HTTP_STATUS_CODES.FORBIDDEN,
  [ErrorCodes.TENANT_ACCESS_DENIED]: HTTP_STATUS_CODES.FORBIDDEN,
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: HTTP_STATUS_CODES.CONFLICT,
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: HTTP_STATUS_CODES.FORBIDDEN,
};

/**
 * Determines if an error code represents a client error (4xx)
 */
export function isClientError(errorCode: string): boolean {
  const status = ERROR_CODE_TO_STATUS[errorCode];
  return status >= 400 && status < 500;
}

/**
 * Determines if an error code represents a server error (5xx)
 */
export function isServerError(errorCode: string): boolean {
  const status = ERROR_CODE_TO_STATUS[errorCode];
  return status >= 500;
}

/**
 * Determines if an error code represents a network error
 */
export function isNetworkError(errorCode: string): boolean {
  return errorCode === ErrorCodes.NETWORK_ERROR || errorCode === ErrorCodes.TIMEOUT_ERROR;
}

/**
 * Determines if an error code represents an authentication/authorization error
 */
export function isAuthError(errorCode: string): boolean {
  return [
    ErrorCodes.AUTHENTICATION_ERROR,
    ErrorCodes.AUTH_REQUIRED,
    ErrorCodes.AUTHORIZATION_ERROR,
    ErrorCodes.ACCESS_DENIED,
    ErrorCodes.INSUFFICIENT_PERMISSIONS
  ].includes(errorCode as ErrorCodes);
}

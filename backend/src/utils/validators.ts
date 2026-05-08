import { ValidationError } from 'class-validator';

/**
 * Format validation errors into a readable string
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors
    .map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Invalid value';
      return `${error.property}: ${constraints}`;
    })
    .join('; ');
};

/**
 * Validate an object and throw if invalid
 */
export const validateOrThrow = async (obj: object): Promise<void> => {
  // Dynamically import class-validator's validate function to avoid naming conflict
  const { validate } = await import('class-validator');
  const errors = await validate(obj);
  if (errors.length > 0) {
    throw new Error(formatValidationErrors(errors));
  }
};

/**
 * Email validation using stricter RFC-compliant regex
 * Allows most valid email formats including + labels
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant regex (simplified but comprehensive)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Additional checks
  if (email.length > 254) return false; // Max email length
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  if (parts[0].length > 64) return false; // Max local part length
  
  return true;
};

/**
 * Password strength validation
 * Minimum 12 characters, at least one uppercase, one lowercase, one digit, one special character
 * Includes all ASCII special characters
 */
export const isValidPassword = (password: string): boolean => {
  const minLength = 12;
  const maxLength = 128; // Prevent denial of service via long passwords
  
  if (password.length < minLength || password.length > maxLength) {
    return false;
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  // Comprehensive special character set including all ASCII special chars
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return (
    hasUppercase &&
    hasLowercase &&
    hasDigit &&
    hasSpecial
  );
};

/**
 * UUID validation
 */
export const isValidUUID = (uuid: string): boolean => {
  // Accepte à la fois les UUID v4 standards et les identifiants numériques pour la compatibilité
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const numericIdRegex = /^\d+$/;
  return uuidRegex.test(uuid) || numericIdRegex.test(uuid);
};

/**
 * TOTP code validation (6 digits)
 */
export const isValidTOTP = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};
/**
 * Phone number utility functions for Charlotte 58Cafe
 */

/**
 * Formats a Thai phone number for SMS delivery in international format
 * @param phone - The phone number in Thai format (e.g., "0812345678", "66812345678", "081-234-5678")
 * @returns Formatted phone number in international format (e.g., "66812345678")
 */
export function formatPhoneForSMS(phone: string): string {
  if (!phone) return ''

  // Remove all non-numeric characters (spaces, dashes, parentheses, plus signs)
  let cleanPhone = phone.replace(/[^0-9]/g, '')

  // If the number starts with '0', replace the leading '0' with '66'
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '66' + cleanPhone.substring(1)
  }
  // If the number doesn't start with '66' and is a valid Thai mobile number, add '66'
  else if (!cleanPhone.startsWith('66') && cleanPhone.length === 9) {
    cleanPhone = '66' + cleanPhone
  }

  return cleanPhone
}

/**
 * Validates if a phone number is a valid Thai mobile number
 * @param phone - The phone number to validate
 * @returns True if valid Thai mobile number, false otherwise
 */
export function isValidThaiMobileNumber(phone: string): boolean {
  if (!phone) return false

  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/[^0-9]/g, '')

  // Check for Thai mobile number formats:
  // - 10 digits starting with 0: 0812345678, 0912345678, 0612345678
  // - 11 digits starting with 66: 66812345678, 66912345678, 66612345678
  // - 9 digits (if user omits leading 0): 812345678, 912345678, 612345678

  if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
    // Check if first digit after 0 is 6, 8, or 9 (Thai mobile prefixes)
    return ['6', '8', '9'].includes(cleanPhone[1])
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('66')) {
    // Check if first digit after 66 is 6, 8, or 9
    return ['6', '8', '9'].includes(cleanPhone[2])
  } else if (cleanPhone.length === 9) {
    // Check if first digit is 6, 8, or 9 (omitted leading 0)
    return ['6', '8', '9'].includes(cleanPhone[0])
  }

  return false
}

/**
 * Formats a phone number for display in Thai format
 * @param phone - The phone number in any format
 * @returns Formatted phone number in Thai format (e.g., "081-234-5678")
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return ''

  // Remove all non-numeric characters
  let cleanPhone = phone.replace(/[^0-9]/g, '')

  // If it's in international format (starts with 66), convert to Thai format
  if (cleanPhone.startsWith('66') && cleanPhone.length === 11) {
    cleanPhone = '0' + cleanPhone.substring(2)
  }

  // Format as 081-234-5678 if we have 10 digits
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }

  // Return as-is if format doesn't match expected pattern
  return phone
}

/**
 * Extracts the Thai format phone number (with leading 0) from any input format
 * @param phone - The phone number in any format
 * @returns Phone number in Thai format (e.g., "0812345678")
 */
export function normalizeThaiPhoneNumber(phone: string): string {
  if (!phone) return ''

  // Remove all non-numeric characters
  let cleanPhone = phone.replace(/[^0-9]/g, '')

  // If it's in international format (starts with 66), convert to Thai format
  if (cleanPhone.startsWith('66') && cleanPhone.length === 11) {
    return '0' + cleanPhone.substring(2)
  }

  // If it's 9 digits (missing leading 0), add the leading 0
  if (cleanPhone.length === 9) {
    return '0' + cleanPhone
  }

  // Return as-is if it's already in Thai format (10 digits starting with 0)
  return cleanPhone
}
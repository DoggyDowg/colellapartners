import supabase from '../../../lib/supabase'

// Reserved words that cannot be used as partner codes
export const RESERVED_WORDS = [
  'ADMIN', 'API', 'WWW', 'MAIL', 'FTP', 'ROOT', 'USER', 'TEST', 'DEMO', 'NULL', 'VOID',
  'SPAM', 'FAKE', 'TEMP', 'DELETE', 'BANNED', 'ERROR', 'SYSTEM', 'SUPPORT', 'HELP',
  'COLELLA', 'PARTNER', 'REFER', 'CODE', 'QR', 'LINK', 'URL', 'CONTACT', 'INFO', 'ABOUT'
]

/**
 * Validates the format of a partner code
 * @param code - The code to validate
 * @returns true if the code format is valid (3-6 alphanumeric characters)
 */
export const validateCodeFormat = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{3,6}$/
  return codeRegex.test(code)
}

/**
 * Checks if a code is a reserved word
 * @param code - The code to check
 * @returns true if the code is reserved
 */
export const isReservedWord = (code: string): boolean => {
  return RESERVED_WORDS.includes(code.toUpperCase())
}

/**
 * Checks if a partner code is unique in the database
 * @param code - The code to check
 * @param currentCode - The current partner's code (to allow updating with same code)
 * @returns Promise<boolean> - true if the code is unique
 */
export const checkCodeUniqueness = async (
  code: string, 
  currentCode?: string
): Promise<boolean> => {
  if (!code || code === currentCode) {
    return true // Current code or empty is always considered available
  }

  try {
    const { data, error } = await supabase
      .from('referrers')
      .select('id')
      .eq('partner_code', code.toUpperCase())
      .limit(1)

    if (error) {
      console.error('Error checking code uniqueness:', error)
      return false
    }

    return data.length === 0
  } catch (error) {
    console.error('Error checking code uniqueness:', error)
    return false
  }
}

/**
 * Generates a referral URL for a given partner code
 * @param code - The partner code
 * @returns The full referral URL
 */
export const generateReferralUrl = (code: string): string => {
  const baseUrl = 'https://www.colellapartners.com.au/refer'
  return (code || '').trim() ? `${baseUrl}/${(code || '').toUpperCase()}` : `${baseUrl}/YOURCODE`
}

/**
 * Validates a partner code completely (format, reserved words, uniqueness)
 * @param code - The code to validate
 * @param currentCode - The current partner's code (optional)
 * @returns Promise with validation result
 */
export const validatePartnerCode = async (
  code: string,
  currentCode?: string
): Promise<{
  isValid: boolean
  isFormatValid: boolean
  isNotReserved: boolean
  isUnique: boolean
  message?: string
}> => {
  const trimmedCode = (code || '').trim().toUpperCase()
  
  if (!trimmedCode) {
    return {
      isValid: false,
      isFormatValid: false,
      isNotReserved: true,
      isUnique: true,
      message: 'Code cannot be empty'
    }
  }

  const isFormatValid = validateCodeFormat(trimmedCode)
  const isNotReserved = !isReservedWord(trimmedCode)
  const isUnique = isFormatValid && isNotReserved 
    ? await checkCodeUniqueness(trimmedCode, currentCode)
    : false

  const isValid = isFormatValid && isNotReserved && isUnique

  let message: string | undefined
  if (!isFormatValid) {
    message = 'Code must be 3-6 characters, letters and numbers only'
  } else if (!isNotReserved) {
    message = 'This code is reserved and cannot be used'
  } else if (!isUnique) {
    message = 'This code is already taken'
  } else if (isValid) {
    message = 'Code is available!'
  }

  return {
    isValid,
    isFormatValid,
    isNotReserved,
    isUnique,
    message
  }
}

/**
 * Sanitizes input for partner code (uppercase, alphanumeric only, max 6 chars)
 * @param input - The raw input string
 * @returns Sanitized code string
 */
export const sanitizeCodeInput = (input: string): string => {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
} 
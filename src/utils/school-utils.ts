/**
 * Utility functions for school name formatting
 */

/**
 * Formats a school name, avoiding redundant suffixes
 * @param schoolName - The school name to format
 * @param schoolType - The type of school (초, 중, 고, 대)
 * @returns Formatted school name without redundant suffix
 */
export function formatSchoolName(schoolName: string, schoolType?: string): string {
  // If no school type is provided, return the name as is
  if (!schoolType) {
    return schoolName;
  }

  // Check if the school name already contains the type indicator
  const hasElementary = schoolName.includes('초등학교') || schoolName.includes('초교');
  const hasMiddle = schoolName.includes('중학교') || schoolName.includes('중교');
  const hasHigh = schoolName.includes('고등학교') || schoolName.includes('고교');
  const hasUniversity = schoolName.includes('대학교') || schoolName.includes('대학');

  // Don't add suffix if the school name already indicates its type
  if (schoolType === '초' && hasElementary) return schoolName;
  if (schoolType === '중' && hasMiddle) return schoolName;
  if (schoolType === '고' && hasHigh) return schoolName;
  if (schoolType === '대' && hasUniversity) return schoolName;

  // Add suffix only if the school name doesn't already indicate its type
  return `${schoolName}(${schoolType})`;
}

/**
 * Extracts school type from school name
 * @param schoolName - The school name to analyze
 * @returns The school type (초, 중, 고, 대) or null
 */
export function getSchoolType(schoolName: string): string | null {
  if (schoolName.includes('초등학교') || schoolName.includes('초교')) return '초';
  if (schoolName.includes('중학교') || schoolName.includes('중교')) return '중';
  if (schoolName.includes('고등학교') || schoolName.includes('고교')) return '고';
  if (schoolName.includes('대학교') || schoolName.includes('대학')) return '대';
  return null;
}

/**
 * Removes redundant suffix from school name
 * @param schoolName - The school name that might have redundant suffix
 * @returns School name without redundant suffix
 */
export function removeRedundantSchoolSuffix(schoolName: string): string {
  // Remove suffixes like (초), (중), (고), (대) if the name already contains the school type
  const suffixPattern = /\((초|중|고|대)\)$/;
  const match = schoolName.match(suffixPattern);
  
  if (match) {
    const suffix = match[1];
    const nameWithoutSuffix = schoolName.replace(suffixPattern, '');
    
    // Check if the name already contains the school type
    if (suffix === '초' && (nameWithoutSuffix.includes('초등학교') || nameWithoutSuffix.includes('초교'))) {
      return nameWithoutSuffix;
    }
    if (suffix === '중' && (nameWithoutSuffix.includes('중학교') || nameWithoutSuffix.includes('중교'))) {
      return nameWithoutSuffix;
    }
    if (suffix === '고' && (nameWithoutSuffix.includes('고등학교') || nameWithoutSuffix.includes('고교'))) {
      return nameWithoutSuffix;
    }
    if (suffix === '대' && (nameWithoutSuffix.includes('대학교') || nameWithoutSuffix.includes('대학'))) {
      return nameWithoutSuffix;
    }
  }
  
  return schoolName;
}
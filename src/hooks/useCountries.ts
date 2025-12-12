import { useQuery } from '@tanstack/react-query';

export interface Country {
  name: string;
  code: string;
  flag: string;
}

// Map of common country codes to their flag emojis
const flagEmojis: Record<string, string> = {};

// Convert country code to flag emoji
const codeToFlagEmoji = (code: string): string => {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async (): Promise<Country[]> => {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flags');
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      
      const data = await response.json();
      
      return data
        .map((country: { name: { common: string }; cca2: string; flags: { png: string } }) => ({
          name: country.name.common,
          code: country.cca2,
          flag: codeToFlagEmoji(country.cca2),
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    refetchOnWindowFocus: false,
  });
};

// Fallback country list for when API is unavailable
export const fallbackCountries: Country[] = [
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'Botswana', code: 'BW', flag: '🇧🇼' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'Georgia', code: 'GE', flag: '🇬🇪' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
];

// Get flag for a country code
export const getCountryFlag = (code: string): string => {
  return codeToFlagEmoji(code);
};

// Get country name from code
export const getCountryName = (code: string, countries: Country[]): string => {
  const country = countries.find(c => c.code === code);
  return country?.name || code;
};

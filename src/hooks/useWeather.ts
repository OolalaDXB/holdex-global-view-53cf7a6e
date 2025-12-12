import { useQuery } from '@tanstack/react-query';

interface WeatherData {
  condition: 'clear' | 'cloudy' | 'partly-cloudy' | 'rain' | 'snow' | 'thunderstorm' | 'fog';
  isNight: boolean;
  temp?: number;
}

interface CityWeather {
  [cityName: string]: WeatherData;
}

// wttr.in weather codes mapping
const getConditionFromCode = (code: string): WeatherData['condition'] => {
  const codeNum = parseInt(code, 10);
  if (codeNum === 113) return 'clear';
  if ([116, 119, 122].includes(codeNum)) return 'cloudy';
  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(codeNum)) return 'rain';
  if ([179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377, 386, 389, 392, 395].includes(codeNum)) return 'snow';
  if ([200, 386, 389, 392, 395].includes(codeNum)) return 'thunderstorm';
  if ([143, 248, 260].includes(codeNum)) return 'fog';
  return 'partly-cloudy';
};

// Check if it's night based on local time
const isNightTime = (timezone: string): boolean => {
  try {
    const now = new Date();
    const localTime = now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    });
    const hour = parseInt(localTime, 10);
    return hour < 6 || hour >= 20; // Night: 8 PM to 6 AM
  } catch {
    return false;
  }
};

const fetchWeatherForCity = async (cityName: string, timezone: string): Promise<WeatherData> => {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(cityName)}?format=j1`);
    if (!response.ok) throw new Error('Weather fetch failed');
    
    const data = await response.json();
    const current = data.current_condition?.[0];
    
    if (!current) throw new Error('No weather data');
    
    const condition = getConditionFromCode(current.weatherCode);
    const isNight = isNightTime(timezone);
    const temp = parseInt(current.temp_C, 10);
    
    return { condition, isNight, temp };
  } catch {
    return { condition: 'clear', isNight: isNightTime(timezone) };
  }
};

export const useWeather = (cities: { name: string; timezone: string }[]) => {
  return useQuery({
    queryKey: ['weather', cities.map(c => c.name).join(',')],
    queryFn: async (): Promise<CityWeather> => {
      if (cities.length === 0) return {};
      
      const weatherPromises = cities.map(city => 
        fetchWeatherForCity(city.name, city.timezone)
          .then(data => ({ name: city.name, data }))
      );
      
      const results = await Promise.all(weatherPromises);
      
      return results.reduce((acc, { name, data }) => {
        acc[name] = data;
        return acc;
      }, {} as CityWeather);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    enabled: cities.length > 0,
  });
};

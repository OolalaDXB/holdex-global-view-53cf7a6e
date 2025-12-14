import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudSun, CloudLightning, CloudFog } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { FavoriteCity } from '@/hooks/useProfile';

interface WorldClocksWidgetProps {
  cities: FavoriteCity[];
  showWeather?: boolean;
}

const WeatherIcon: React.FC<{ condition: string; isNight: boolean; className?: string }> = ({ 
  condition, 
  isNight,
  className = "w-4 h-4"
}) => {
  // Consistent blue-tinted color palette for weather icons
  if (isNight && condition === 'clear') {
    return <Moon className={`${className} text-sky-300`} />;
  }

  switch (condition) {
    case 'clear':
      return <Sun className={`${className} text-sky-400`} />;
    case 'partly-cloudy':
      return isNight 
        ? <Cloud className={`${className} text-sky-400/70`} />
        : <CloudSun className={`${className} text-sky-400`} />;
    case 'cloudy':
      return <Cloud className={`${className} text-sky-400/70`} />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-500`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-sky-300`} />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-sky-600`} />;
    case 'fog':
      return <CloudFog className={`${className} text-sky-400/60`} />;
    default:
      return isNight 
        ? <Moon className={`${className} text-sky-300`} />
        : <Sun className={`${className} text-sky-400`} />;
  }
};

export const WorldClocksWidget: React.FC<WorldClocksWidgetProps> = ({ cities, showWeather = true }) => {
  const [times, setTimes] = useState<Record<string, string>>({});
  const { data: weatherData } = useWeather(showWeather ? cities : []);

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, string> = {};
      cities.forEach(city => {
        try {
          const time = new Date().toLocaleTimeString('en-GB', {
            timeZone: city.timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          newTimes[city.name] = time;
        } catch {
          newTimes[city.name] = '--:--';
        }
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [cities]);

  if (cities.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        {cities.map((city, index) => {
          const weather = weatherData?.[city.name];
          
          return (
            <div key={city.name} className="flex items-center gap-2">
              <span className="text-muted-foreground">{city.name}</span>
              {showWeather && weather && (
                <div className="flex items-center gap-1">
                  <WeatherIcon 
                    condition={weather.condition} 
                    isNight={weather.isNight}
                    className="w-4 h-4"
                  />
                  {weather.temp !== undefined && (
                    <span className="text-[10px] text-muted-foreground">{weather.temp}°</span>
                  )}
                </div>
              )}
              <span className="font-mono text-foreground">{times[city.name] || '--:--'}</span>
              {index < cities.length - 1 && (
                <span className="text-border ml-4">|</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

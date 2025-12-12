import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudSun, CloudLightning, CloudFog } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';

interface City {
  name: string;
  timezone: string;
}

interface WorldClocksWidgetProps {
  cities: City[];
  showWeather?: boolean;
}

const WeatherIcon: React.FC<{ condition: string; isNight: boolean; className?: string }> = ({ 
  condition, 
  isNight,
  className = "w-4 h-4"
}) => {
  if (isNight && condition === 'clear') {
    return <Moon className={`${className} text-blue-300`} />;
  }

  switch (condition) {
    case 'clear':
      return <Sun className={`${className} text-amber-400`} />;
    case 'partly-cloudy':
      return isNight 
        ? <Cloud className={`${className} text-muted-foreground`} />
        : <CloudSun className={`${className} text-amber-300`} />;
    case 'cloudy':
      return <Cloud className={`${className} text-muted-foreground`} />;
    case 'rain':
      return <CloudRain className={`${className} text-blue-400`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-blue-200`} />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-purple-400`} />;
    case 'fog':
      return <CloudFog className={`${className} text-muted-foreground`} />;
    default:
      return isNight 
        ? <Moon className={`${className} text-blue-300`} />
        : <Sun className={`${className} text-amber-400`} />;
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

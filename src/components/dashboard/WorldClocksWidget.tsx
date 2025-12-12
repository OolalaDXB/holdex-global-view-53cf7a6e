import { useState, useEffect } from 'react';

interface City {
  name: string;
  timezone: string;
}

interface WorldClocksWidgetProps {
  cities: City[];
}

export const WorldClocksWidget: React.FC<WorldClocksWidgetProps> = ({ cities }) => {
  const [times, setTimes] = useState<Record<string, string>>({});

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
        {cities.map((city, index) => (
          <div key={city.name} className="flex items-center gap-2">
            <span className="text-muted-foreground">{city.name}</span>
            <span className="font-mono text-foreground">{times[city.name] || '--:--'}</span>
            {index < cities.length - 1 && (
              <span className="text-border ml-4">|</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

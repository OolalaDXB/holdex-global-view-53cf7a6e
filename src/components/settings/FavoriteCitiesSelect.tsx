import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface City {
  name: string;
  timezone: string;
}

const AVAILABLE_CITIES: City[] = [
  { name: 'Dubai', timezone: 'Asia/Dubai' },
  { name: 'Paris', timezone: 'Europe/Paris' },
  { name: 'London', timezone: 'Europe/London' },
  { name: 'New York', timezone: 'America/New_York' },
  { name: 'Singapore', timezone: 'Asia/Singapore' },
  { name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { name: 'Zurich', timezone: 'Europe/Zurich' },
  { name: 'Cascais', timezone: 'Europe/Lisbon' },
  { name: 'Moscow', timezone: 'Europe/Moscow' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo' },
  { name: 'Sydney', timezone: 'Australia/Sydney' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { name: 'Gaborone', timezone: 'Africa/Gaborone' },
  { name: 'Johannesburg', timezone: 'Africa/Johannesburg' },
  { name: 'São Paulo', timezone: 'America/Sao_Paulo' },
];

interface FavoriteCitiesSelectProps {
  value: City[];
  onChange: (cities: City[]) => void;
  maxCities?: number;
}

export const FavoriteCitiesSelect: React.FC<FavoriteCitiesSelectProps> = ({
  value,
  onChange,
  maxCities = 5,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('');

  const addCity = () => {
    if (!selectedCity || value.length >= maxCities) return;
    
    const city = AVAILABLE_CITIES.find(c => c.name === selectedCity);
    if (city && !value.some(c => c.name === city.name)) {
      onChange([...value, city]);
    }
    setSelectedCity('');
  };

  const removeCity = (name: string) => {
    onChange(value.filter(c => c.name !== name));
  };

  const availableCities = AVAILABLE_CITIES.filter(
    city => !value.some(c => c.name === city.name)
  );

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(city => (
            <div
              key={city.name}
              className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
            >
              <span>{city.name}</span>
              <button
                onClick={() => removeCity(city.name)}
                className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {value.length < maxCities && (
        <div className="flex gap-2">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Add a city" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map(city => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addCity}
            disabled={!selectedCity}
          >
            <Plus size={16} />
          </Button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxCities} cities selected
      </p>
    </div>
  );
};

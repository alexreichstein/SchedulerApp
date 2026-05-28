// Hook för att hämta väderdata från Open-Meteo API
// Använder Västerås koordinater
// Returnerar temperatur och väderkod för ett givet datum

import { useState } from 'react';

// Västerås koordinater
const LAT = 59.6099;
const LON = 16.5448;

// Typ för väderdata
type WeatherData = {
  temperature: number;    // Temperatur i Celsius
  weatherCode: number;    // WMO väderkod (0=sol, 1-3=moln, 51-67=regn etc.)
};

// Konverterar WMO väderkod till emoji
export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

// Konverterar WMO väderkod till beskrivning
export function weatherDescription(code: number): string {
  if (code === 0) return 'Klart';
  if (code <= 3) return 'Molnigt';
  if (code <= 48) return 'Dimma';
  if (code <= 67) return 'Regn';
  if (code <= 77) return 'Snö';
  if (code <= 82) return 'Skurar';
  if (code <= 99) return 'Åska';
  return 'Okänt';
}

export function useWeather() {
  // Väderdata per datum (cache så vi inte hämtar samma datum flera gånger)
  const [cache, setCache] = useState<Record<string, WeatherData>>({});

  // Hämtar väder för ett givet datum
  const fetchWeather = async (date: Date): Promise<WeatherData | null> => {
    // Formaterar datum som YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    // Returnerar cachat värde om det finns
    if (cache[dateStr]) return cache[dateStr];

    try {
      // Hämtar väderdata från Open-Meteo — gratis, ingen API-nyckel behövs
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max&timezone=Europe/Stockholm&start_date=${dateStr}&end_date=${dateStr}`;
      const response = await fetch(url);
      const data = await response.json();

      const weather: WeatherData = {
        temperature: Math.round(data.daily.temperature_2m_max[0]),
        weatherCode: data.daily.weathercode[0],
      };

      // Sparar i cache
      setCache((prev) => ({ ...prev, [dateStr]: weather }));
      return weather;
    } catch (error) {
      console.error('Väderfel:', error);
      return null;
    }
  };

  return { fetchWeather, weatherEmoji, weatherDescription };
}
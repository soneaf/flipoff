import { Router } from 'express';

const router = Router();

let weatherCache = null;
let cacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

router.get('/', async (req, res) => {
  const { config } = req.app.locals;
  const { lat, lon } = req.query;

  if (!config.openWeatherMapKey) {
    return res.status(400).json({ error: 'OpenWeatherMap API key not configured' });
  }

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon required' });
  }

  // Check cache
  const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;
  if (weatherCache && weatherCache.key === cacheKey && Date.now() - cacheTime < CACHE_DURATION) {
    return res.json(weatherCache.data);
  }

  try {
    const apiKey = config.openWeatherMapKey;

    // Current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const current = await currentRes.json();

    if (current.cod && current.cod !== 200) {
      return res.status(502).json({ error: current.message || 'Weather API error' });
    }

    // 5-day forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&cnt=8&appid=${apiKey}`
    );
    const forecast = await forecastRes.json();

    const data = {
      city: current.name?.toUpperCase() || 'UNKNOWN',
      temp: Math.round(current.main?.temp),
      feelsLike: Math.round(current.main?.feels_like),
      high: Math.round(current.main?.temp_max),
      low: Math.round(current.main?.temp_min),
      description: current.weather?.[0]?.description?.toUpperCase() || '',
      humidity: current.main?.humidity,
      wind: Math.round(current.wind?.speed),
      tomorrow: null
    };

    // Get tomorrow's forecast (entries are 3-hour intervals, ~8 entries = 24h)
    if (forecast.list && forecast.list.length > 0) {
      const temps = forecast.list.map(f => f.main.temp);
      data.tomorrow = {
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        description: forecast.list[4]?.weather?.[0]?.description?.toUpperCase() || ''
      };
    }

    weatherCache = { key: cacheKey, data };
    cacheTime = Date.now();

    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch weather data' });
  }
});

export { router as weatherRouter };

import { Router } from 'express';

const router = Router();

let tourCache = null;
let cacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Get next tour events from MasterTour API
router.get('/next', async (req, res) => {
  const { config } = req.app.locals;

  if (!config.mastertourUrl) {
    return res.status(400).json({ error: 'MasterTour URL not configured' });
  }

  if (tourCache && Date.now() - cacheTime < CACHE_DURATION) {
    return res.json(tourCache);
  }

  try {
    // Fetch tour days from MasterTour API
    const response = await fetch(`${config.mastertourUrl}/api/tour-days`);
    if (!response.ok) {
      return res.status(502).json({ error: 'MasterTour API unavailable' });
    }

    const tourDays = await response.json();
    const today = new Date().toISOString().split('T')[0];

    // Find upcoming days
    const upcoming = tourDays
      .filter(day => day.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    const result = {
      nextShow: null,
      nextFlight: null,
      nextHotel: null,
      nextDay: null
    };

    // Next show day
    const nextShowDay = upcoming.find(d => d.dayType === 'show');
    if (nextShowDay) {
      result.nextShow = {
        date: nextShowDay.date,
        dayOfWeek: nextShowDay.dayOfWeek,
        city: nextShowDay.city,
        state: nextShowDay.stateOrCountry,
        venue: nextShowDay.venue?.name || '',
        time: nextShowDay.mainEvent?.time || ''
      };
    }

    // Next flight from any upcoming day
    for (const day of upcoming) {
      if (day.flights && day.flights.length > 0) {
        const flight = day.flights[0];
        result.nextFlight = {
          date: day.date,
          flightNumber: flight.flightNumber,
          airline: flight.airline || '',
          origin: flight.origin,
          originCity: flight.originCity,
          destination: flight.destination,
          destinationCity: flight.destinationCity,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime
        };
        break;
      }
    }

    // Next hotel
    for (const day of upcoming) {
      if (day.hotel) {
        result.nextHotel = {
          date: day.date,
          name: day.hotel.name,
          city: day.hotel.city || day.city,
          checkIn: day.hotel.checkIn || ''
        };
        break;
      }
    }

    // Next day summary
    if (upcoming.length > 0) {
      result.nextDay = {
        date: upcoming[0].date,
        dayOfWeek: upcoming[0].dayOfWeek,
        city: upcoming[0].city,
        state: upcoming[0].stateOrCountry,
        dayType: upcoming[0].dayType
      };
    }

    tourCache = result;
    cacheTime = Date.now();

    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Failed to connect to MasterTour' });
  }
});

export { router as mastertourRouter };

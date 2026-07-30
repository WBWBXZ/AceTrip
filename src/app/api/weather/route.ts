import { NextRequest, NextResponse } from 'next/server';

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
  };
}

interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat or lng parameters' }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return NextResponse.json({ error: 'Invalid lat or lng values' }, { status: 400 });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo API returned ${res.status}`);
    }

    const data: OpenMeteoResponse = await res.json();

    const daily: DailyWeather[] = data.daily.time.map((date, i) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
      weatherCode: data.daily.weathercode[i],
    }));

    return NextResponse.json({ daily });
  } catch (error) {
    console.error('[weather API]', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}

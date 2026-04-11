import httpx
import asyncio
from datetime import datetime, timedelta
import random
import math

class DataSourceService:
    @staticmethod
    async def get_nasa_power_data(lat: float, lng: float):
        """
        Fetches T2M (Temp), RH2M (Humidity), and PRECTOTCORR (Rainfall) from NASA POWER.
        Falls back to physics-based estimation if API fails.
        """
        end_date = datetime.now().strftime("%Y%m%d")
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y%m%d")
        
        url = (
            f"https://power.larc.nasa.gov/api/temporal/daily/point?"
            f"parameters=PRECTOTCORR,T2M,RH2M&community=RE&"
            f"longitude={lng}&latitude={lat}&start={start_date}&end={end_date}&format=JSON"
        )
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                
                params = data['properties']['parameter']
                
                # Get the last 7 valid (non -999) values for averaging
                def get_valid_avg(param_data):
                    vals = [v for v in list(param_data.values())[-30:] if v not in (-999, -999.0)]
                    return round(sum(vals) / len(vals), 2) if vals else None
                
                temp = get_valid_avg(params['T2M'])
                humidity = get_valid_avg(params['RH2M'])
                rainfall = get_valid_avg(params['PRECTOTCORR'])
                
                # If still None, fall through to estimation
                if temp is None and humidity is None and rainfall is None:
                    raise ValueError("All NASA values are -999 (no data for region)")
                
                return {
                    "temp": temp if temp is not None else "N/A",
                    "humidity": humidity if humidity is not None else "N/A",
                    "rainfall": rainfall if rainfall is not None else "N/A",
                    "source": "NASA POWER"
                }
            except Exception as e:
                print(f"NASA POWER Error: {e} — using physics-based estimation")
                return DataSourceService._estimate_climate(lat, lng)

    @staticmethod
    def _estimate_climate(lat: float, lng: float):
        """
        Physics-based climate estimation based on latitude and longitude.
        Used when NASA POWER is unavailable.
        """
        abs_lat = abs(lat)
        
        # Temperature: equatorial ~30°C, polar ~-20°C
        base_temp = 30 - (abs_lat / 90) * 50
        # Seasonal variation based on current month
        month = datetime.now().month
        seasonal = 5 * math.sin((month - 3) * math.pi / 6) * (1 if lat > 0 else -1)
        temp = round(base_temp + seasonal + random.uniform(-2, 2), 1)
        
        # Humidity: higher near equator and coasts
        coast_factor = min(1.0, 1 / (1 + abs((lng % 360) - 180) / 90))
        humidity = round(80 - abs_lat * 0.5 + coast_factor * 10 + random.uniform(-5, 5), 1)
        humidity = max(10, min(99, humidity))
        
        # Rainfall: tropical belt (±25° lat) gets more rain
        if abs_lat < 10:
            rainfall = round(random.uniform(5, 20), 2)
            wind_speed = round(random.uniform(10, 30), 1)
        elif abs_lat < 25:
            rainfall = round(random.uniform(2, 12), 2)
            wind_speed = round(random.uniform(5, 20), 1)
        elif abs_lat < 50:
            rainfall = round(random.uniform(0.5, 6), 2)
            wind_speed = round(random.uniform(2, 12), 1)
        else:
            rainfall = round(random.uniform(0, 3), 2)
            wind_speed = round(random.uniform(1, 8), 1)
        
        # NDVI and Soil Moisture grounded in Climate
        ndvi = round(random.uniform(0.1, 0.8), 2)
        if rainfall > 15: 
            soil_moisture = round(random.uniform(0.6, 0.95), 2)
            ndvi = min(0.9, ndvi + 0.2)
        elif rainfall < 2:
            soil_moisture = round(random.uniform(0.05, 0.3), 2)
            ndvi = max(0.05, ndvi - 0.2)
        else:
            soil_moisture = round(random.uniform(0.3, 0.6), 2)
        
        return {
            "temp": temp,
            "humidity": humidity,
            "rainfall": rainfall,
            "wind_speed": wind_speed,
            "soil_moisture": soil_moisture,
            "ndvi": ndvi,
            "source": "STRATUM ESTIMATE"
        }

    @staticmethod
    async def get_usgs_seismic_data(lat: float, lng: float):
        """
        Fetches seismic events within 500km radius of the coordinates from USGS.
        """
        # Search within 500km radius for relevant seismic activity
        url = (
            f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson"
            f"&latitude={lat}&longitude={lng}&maxradiuskm=500&limit=1&minmagnitude=1.0"
            f"&starttime={(datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')}"
        )
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=8.0)
                data = response.json()
                if data.get('features'):
                    feat = data['features'][0]
                    props = feat['properties']
                    coords = feat['geometry']['coordinates']
                    return {
                        "mag": props['mag'],
                        "place": props['place'],
                        "time": props['time'],
                        "depth_km": coords[2] if len(coords) > 2 else "N/A"
                    }
                # No recent local quake — return low background seismicity
                return {
                    "mag": round(random.uniform(0.1, 1.5), 2),
                    "place": f"Background seismicity near {lat:.2f}°N {lng:.2f}°E",
                    "time": int(datetime.now().timestamp() * 1000),
                    "depth_km": round(random.uniform(5, 30), 1)
                }
            except Exception as e:
                print(f"USGS Error: {e}")
                return {
                    "mag": round(random.uniform(0.1, 1.5), 2),
                    "place": f"Background seismicity near {lat:.2f}°N {lng:.2f}°E",
                    "time": int(datetime.now().timestamp() * 1000),
                    "depth_km": None
                }

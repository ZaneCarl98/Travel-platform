# core/utils.py
import requests


def geocode_city(city_name: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": city_name,
        "format": "json",
        "limit": 1,
    }
    headers = {
        "User-Agent": "travel-platform-app/1.0"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data:
            return None, None

        lat = float(data[0]["lat"])
        lng = float(data[0]["lon"])
        return lat, lng
    except Exception:
        return None, None
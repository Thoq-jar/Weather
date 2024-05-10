document.addEventListener("DOMContentLoaded", () => {
    const weatherInfo = document.getElementById("weatherInfo");
    const searchButton = document.getElementById("searchButton");
    const cityInput = document.getElementById("cityInput");

    async function getUserLocationAndFetchWeather() {
        if ("geolocation" in navigator) {
            try {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        fetchWeather(null, latitude, longitude);
                        setInterval(async () => {
                            fetchWeather(null, latitude, longitude);
                            console.log("Reloading...")
                            window.location.reload();
                        }, 600000);
                    },
                    () => {
                        showError("Unable to access geolocation. Please enable location services.");
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            } catch (error) {
                console.error("Error accessing geolocation:", error);
                showError("Error accessing geolocation. Please try again later.");
            }
        } else {
            showError("Geolocation is not supported by this browser.");
        }
    }

    async function fetchWeather(city, lat, lon) {
        try {
            const apiKey = "36496bad1955bf3365448965a42b9eac";
            let apiUrl;
            if (city) {
                apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;
            } else if (lat && lon) {
                apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
            } else {
                throw new Error("City name or coordinates are required.");
            }
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (response.ok) {
                displayWeather(data);
            } else {
                showError(data.message);
            }
        } catch (error) {
            console.error("Error fetching weather data:", error);
            showError("Error fetching weather data. Please try again later.");
        }
    }


    function capitalizeFirstLetterOfEachWord(str) {
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

   async function displayWeather(data, lat, lon) {
    const cityName = data.name;
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const description = capitalizeFirstLetterOfEachWord(data.weather[0].description);

    // const windSpeed = await fetchWindSpeed(lat, lon);
    // const windSpeedText = windSpeed !== null ? `${windSpeed} mph` : "N/A";

    // const airQualityData = await fetchAirQuality(lat, lon);
	   /*
    if (airQualityData) {
        const airQualityIndex = airQualityData.aqi;
        const airQualityDescription = airQualityData.quality;

        const weatherHTML = `
          <h2>${cityName}</h2>
          <p class="temperature">${temperature}°F</p>
          <p>Humidity: ${humidity}%</p>
		  <p>Condition: ${description}</p>
		  <!--
          <p>Wind Speed: ${windSpeedText}</p>
          <p>[WIP] AQI: ${airQualityIndex} (${airQualityDescription})</p>
		  -->
        `;
        weatherInfo.innerHTML = weatherHTML;
    } else {
	   */
        const weatherHTML = `
          <h2>${cityName}</h2>
          <p class="temperature">${temperature}°F</p>
          <p>Humidity: ${humidity}%</p>
          <p>Condition: ${description}</p>
        `;
        weatherInfo.innerHTML = weatherHTML;
    }
// }


    function showError(message) {
        weatherInfo.innerHTML = `<p>${message}</p>`;
    }

    getUserLocationAndFetchWeather();

    searchButton.addEventListener("click", () => {
        const city = cityInput.value.trim();
        if (city !== "") {
            fetchWeather(city);
        } else {
            alert("Please enter a city name.");
        }
    });

    function parseCoordinates(inputString) {
        const regex = /(\d+\.\d+)°\s([NS])\s*,\s*(\d+\.\d+)°\s([EW])/;
        const match = inputString.match(regex);
        if (match) {
            const lat = parseFloat(match[1]);
            const latDir = match[2];
            const lon = parseFloat(match[3]);
            const lonDir = match[4];
            return { lat, lon, latDir, lonDir };
        }
        return null;
    }

    searchButton.addEventListener("click", async () => {
        let city = cityInput.value.trim();
        if (city === "") {
            return;
        }
        const parsedCoordinates = parseCoordinates(city);
        if (parsedCoordinates) {
            fetchWeather(parsedCoordinates.lat, parsedCoordinates.lon);
        } else {
            fetchWeather(city);
        }
    });

    getUserLocationAndFetchWeather();
});

document.addEventListener("DOMContentLoaded", () => {
    const weatherInfo = document.getElementById("weatherInfo");

    async function getUserLocationAndFetchWeather() {
        if ("geolocation" in navigator) {
            try {
                const position = await navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const city = await getCityNameFromCoordinates(position.coords.latitude, position.coords.longitude);
                        if (city) {
                            fetchWeather(city);
                        } else {
                            showError("Unable to determine city from coordinates.");
                        }
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

    async function getCityNameFromCoordinates(lat, lon) {
        const apiUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.locality) {
                return data.locality;
            } else {
                throw new Error("City not found in response.");
            }
        } catch (error) {
            console.error("Error getting city name from coordinates:", error);
            return null;
        }
    }

    async function fetchWeather(city) {
        try {
            const apiKey = "36496bad1955bf3365448965a42b9eac";
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;
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

    function displayWeather(data) {
        const cityName = data.name;
        const temperature = data.main.temp;
        // Capitalize the first letter of each word in the description
        const description = capitalizeFirstLetterOfEachWord(data.weather[0].description);
        const weatherHTML = `
      <h2>${cityName}</h2>
      <p class="temperature">${temperature}°F</p>
      <p>Condition: ${description}</p>
    `;
        weatherInfo.innerHTML = weatherHTML;
    }

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
            alert("Please enter a city name or coordinates.");
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

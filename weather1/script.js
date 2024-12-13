document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '9002256625908ae8a1e4038c2ef83c60';
    const newsApiKey = '9877904dcf8949ef952ad645e7b33278';
    let city = 'London'; // Default city
    const searchBtn = document.getElementById('search-btn');
    const cityInput = document.getElementById('city-input');
    const loadingSpinner = document.getElementById('loading-spinner');

    let weatherChart; // Declare chart instance globally

    function fetchWeather(city) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
        loadingSpinner.style.display = 'block';
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                updateWeather(data);
                fetchNews(city); // Fetch news after fetching weather data
                loadingSpinner.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                loadingSpinner.style.display = 'none';
            });
    }

    searchBtn.addEventListener('click', () => {
        city = cityInput.value;
        if (city) {
            fetchWeather(city);
        }
    });

    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchBtn.click(); // Simulate a click on the search button
        }
    });

    fetchWeather(city);

    function updateWeather(data) {
        const todayWeather = data.list[0];
        const city = data.city.name;
        const date = new Date(todayWeather.dt * 1000).toLocaleDateString();
        const temp = todayWeather.main.temp;
        const description = todayWeather.weather[0].description;
        const minTemp = todayWeather.main.temp_min;
        const maxTemp = todayWeather.main.temp_max;
        const windSpeed = todayWeather.wind.speed;
        const humidity = todayWeather.main.humidity;
        const sunrise = new Date(data.city.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(data.city.sunset * 1000).toLocaleTimeString();

        document.getElementById('city-name').textContent = city;
        document.getElementById('date').textContent = date;
        document.getElementById('temperature').textContent = `Temperature: ${temp}°C`;
        document.getElementById('description').textContent = description;
        document.getElementById('min-temp').textContent = `Min Temp: ${minTemp}°C`;
        document.getElementById('max-temp').textContent = `Max Temp: ${maxTemp}°C`;
        document.getElementById('wind-speed').textContent = `Wind Speed: ${windSpeed} m/s`;
        document.getElementById('humidity').textContent = `Humidity: ${humidity}%`;
        document.getElementById('sunrise').textContent = `Sunrise: ${sunrise}`;
        document.getElementById('sunset').textContent = `Sunset: ${sunset}`;

        // Fetch and update UV Index
        const lat = data.city.coord.lat;
        const lon = data.city.coord.lon;
        const apiUrlUv = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        fetch(apiUrlUv)
            .then(response => response.json())
            .then(uvData => {
                document.getElementById('uv-index').textContent = `UV Index: ${uvData.value}`;
            });

        const forecastContainer = document.getElementById('forecast');
        forecastContainer.innerHTML = ''; // Clear previous forecast

        const dates = [];
        const temps = [];
        
        for (let i = 1; i < data.list.length; i += 8) {
            const forecast = data.list[i];
            const forecastDate = new Date(forecast.dt * 1000).toLocaleDateString();
            const forecastTemp = forecast.main.temp;
            const forecastDescription = forecast.weather[0].description;

            const forecastElement = document.createElement('div');
            forecastElement.className = 'forecast-day';
            forecastElement.innerHTML = `
                <h4>${forecastDate}</h4>
                <p>${forecastTemp}°C</p>
                <p>${forecastDescription}</p>
                <div class="forecast-day-content">
                    <p>Min Temp: ${forecast.main.temp_min}°C</p>
                    <p>Max Temp: ${forecast.main.temp_max}°C</p>
                    <p>Wind Speed: ${forecast.wind.speed} m/s</p>
                    <p>Humidity: ${forecast.main.humidity}%</p>
                </div>
            `;
            forecastElement.addEventListener('click', () => {
                forecastElement.classList.toggle('expanded');
            });
            forecastContainer.appendChild(forecastElement);

            // Prepare data for the chart
            dates.push(forecastDate);
            temps.push(forecastTemp);
        }

        // Create or update the chart
        const ctx = document.getElementById('weather-chart').getContext('2d');
        if (weatherChart) {
            weatherChart.data.labels = dates;
            weatherChart.data.datasets[0].data = temps;
            weatherChart.update();
        } else {
            weatherChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Temperature',
                        data: temps,
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 171, 255, 0.2)', // Light blue for background
                        borderWidth: 2,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    return `Temperature: ${tooltipItem.raw}°C`;
                                }
                            }
                        }
                    },
                    elements: {
                        line: {
                            borderWidth: 2,
                            borderColor: '#4facfe',
                            borderWidth: 5,
                        },
                        point: {
                            radius: 5,
                            backgroundColor: '#4facfe',
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                            },
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 10,
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                            }
                        }
                    }
                }
            });
        }

        changeBackground(description);
    }

    function fetchNews(city) {
        const newsApiUrl = `https://newsapi.org/v2/everything?q=${city}&apiKey=${newsApiKey}`;
        fetch(newsApiUrl)
            .then(response => response.json())
            .then(data => {
                updateNews(data.articles.slice(0, 5)); // Limit to 5 articles
            })
            .catch(error => {
                console.error('Error fetching news data:', error);
            });
    }

    function updateNews(articles) {
        const newsContainer = document.getElementById('news-articles');
        newsContainer.innerHTML = ''; // Clear previous news

        articles.forEach(article => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-article';
            newsElement.innerHTML = `
                <h3>${article.title}</h3>
                <p>${article.description}</p>
                <a href="${article.url}" target="_blank">Read more</a>
            `;
            newsContainer.appendChild(newsElement);
        });
    }

    function changeBackground(description) {
        let imageUrl = '';
        if (description.includes('rain')) {
            imageUrl = 'rainy.gif';
        } else if (description.includes('clear')) {
            imageUrl = 'sunny.gif';
        } else if (description.includes('cloud')) {
            imageUrl = 'cloudy.gif';
        } else {
            imageUrl = 'default.jpg';
        }
        document.body.style.backgroundImage = `url(${imageUrl})`;
    }
});

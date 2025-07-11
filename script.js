//Declare a variable to store the searched city
var city = "";
// variable declaration
var searchCity = $("#search-city");
var searchButton = $("#search-button");
var clearButton = $("#clear-history");
var locationButton = $("#location-button");
var currentCity = $("#current-city");
var currentTemperature = $("#temperature");
var currentHumidty = $("#humidity");
var currentWSpeed = $("#wind-speed");
var currentUvindex = $("#uv-index");
var loadingOverlay = $("#loading-overlay");
var notificationContainer = $("#notification-container");
var sCity = [];

// DateTime elements
var timeHours = $("#time-hours");
var timeMinutes = $("#time-minutes");
var timeSeconds = $("#time-seconds");
var timeAmPm = $("#time-ampm");
var dateDay = $("#date-day");
var dateFull = $("#date-full");

//Set up the API key
var APIKey = "a0aca8a89948154a4182dcecc780b513";

// Real-time Clock Functions
function updateDateTime() {
  var now = new Date();

  // Time formatting
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var ampm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  // Add leading zeros
  var displayHours = hours.toString().padStart(2, "0");
  var displayMinutes = minutes.toString().padStart(2, "0");
  var displaySeconds = seconds.toString().padStart(2, "0");

  // Update time with animation
  updateTimeDigit(timeHours, displayHours);
  updateTimeDigit(timeMinutes, displayMinutes);
  updateTimeDigit(timeSeconds, displaySeconds);

  // Update AM/PM
  if (timeAmPm.text() !== ampm) {
    timeAmPm.fadeOut(200, function () {
      $(this).text(ampm).fadeIn(200);
    });
  }

  // Date formatting
  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  var dayName = days[now.getDay()];
  var monthName = months[now.getMonth()];
  var date = now.getDate();
  var year = now.getFullYear();

  var fullDate = monthName + " " + date + ", " + year;

  // Update date
  if (dateDay.text() !== dayName) {
    dateDay.fadeOut(200, function () {
      $(this).text(dayName).fadeIn(200);
    });
  }

  if (dateFull.text() !== fullDate) {
    dateFull.fadeOut(200, function () {
      $(this).text(fullDate).fadeIn(200);
    });
  }
}

function updateTimeDigit(element, newValue) {
  if (element.text() !== newValue) {
    element.addClass("updating");
    setTimeout(function () {
      element.text(newValue).removeClass("updating");
    }, 150);
  }
}

function startClock() {
  updateDateTime(); // Initial update
  setInterval(updateDateTime, 1000); // Update every second
}

// Show/Hide Loading
function showLoading() {
  loadingOverlay.removeClass("d-none");
}

function hideLoading() {
  loadingOverlay.addClass("d-none");
}

// Enhanced notification system
function showNotification(message, type = "info") {
  // Create notification element
  var notification = $(`
        <div class="notification notification-${type}">
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)} me-2"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `);

  // Add to container
  notificationContainer.append(notification);

  // Trigger animation
  setTimeout(function () {
    notification.addClass("show");
  }, 10);

  // Auto remove after 4 seconds
  setTimeout(function () {
    hideNotification(notification);
  }, 4000);

  // Manual close
  notification.find(".notification-close").click(function () {
    hideNotification(notification);
  });
}

function hideNotification(notification) {
  notification.removeClass("show");
  setTimeout(function () {
    notification.remove();
  }, 300);
}

function getNotificationIcon(type) {
  switch (type) {
    case "success":
      return "fa-check-circle";
    case "warning":
      return "fa-exclamation-triangle";
    case "error":
      return "fa-times-circle";
    default:
      return "fa-info-circle";
  }
}

// UV Index Color Coding
function setUVIndexColor(uvValue) {
  var uvElement = $(currentUvindex);
  uvElement.removeClass("uv-low uv-moderate uv-high");

  if (uvValue <= 2) {
    uvElement.addClass("uv-low");
  } else if (uvValue <= 7) {
    uvElement.addClass("uv-moderate");
  } else {
    uvElement.addClass("uv-high");
  }
}

// Geolocation Functions
function getCurrentLocation() {
  if (navigator.geolocation) {
    showLoading();
    showNotification("Getting your location...", "info");

    navigator.geolocation.getCurrentPosition(
      function (position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        getCurrentWeatherByCoords(lat, lon);
      },
      function (error) {
        hideLoading();
        handleGeolocationError(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
      }
    );
  } else {
    showNotification("Geolocation is not supported by your browser.", "error");
  }
}

function handleGeolocationError(error) {
  var message = "";
  var showInstructions = false;

  switch (error.code) {
    case error.PERMISSION_DENIED:
      message =
        "Location access denied. You can manually search for a city or enable location permissions in your browser settings.";
      showInstructions = true;
      break;
    case error.POSITION_UNAVAILABLE:
      message =
        "Location information is unavailable. Please search for a city manually.";
      break;
    case error.TIMEOUT:
      message =
        "Location request timed out. Please try again or search manually.";
      break;
    default:
      message = "Unable to get location. Please search for a city manually.";
      break;
  }

  showNotification(message, "warning");

  // Show instructions for enabling location if permission was denied
  if (showInstructions) {
    setTimeout(function () {
      showLocationInstructions();
    }, 1000);
  }
}

function showLocationInstructions() {
  var instructions = `
        <div class="location-instructions">
            <h6><i class="fas fa-info-circle me-2"></i>To enable location access:</h6>
            <ul>
                <li>Click the location icon in your browser's address bar</li>
                <li>Select "Allow" for location access</li>
                <li>Refresh the page or click "Use Current Location" again</li>
            </ul>
        </div>
    `;

  // Add instructions to sidebar
  if ($(".location-instructions").length === 0) {
    $(".search-section").after(instructions);

    // Auto-remove after 10 seconds
    setTimeout(function () {
      $(".location-instructions").fadeOut(function () {
        $(this).remove();
      });
    }, 10000);
  }
}

// Get weather by coordinates (for geolocation)
function getCurrentWeatherByCoords(lat, lon) {
  var queryURL =
    "https://api.openweathermap.org/data/2.5/weather?lat=" +
    lat +
    "&lon=" +
    lon +
    "&APPID=" +
    APIKey;

  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function (response) {
      console.log(response);

      // Set the city name for storage
      city = response.name;

      // Display weather data
      displayWeatherData(response);

      // Get forecast by city ID
      forecast(response.id);

      // Add to search history
      addLocationToHistory(response.name);

      hideLoading();
      showNotification(`Weather loaded for ${response.name}`, "success");
    })
    .catch(function (error) {
      console.error("Error fetching weather data by coordinates:", error);
      hideLoading();
      showNotification(
        "Unable to fetch weather for your location. Please try searching manually.",
        "error"
      );
      loadDefaultCity();
    });
}

// Display weather data (extracted for reuse)
function displayWeatherData(response) {
  //Data object from server side Api for icon property.
  var weathericon = response.weather[0].icon;
  var iconurl = "https://openweathermap.org/img/wn/" + weathericon + "@2x.png";
  var date = new Date(response.dt * 1000).toLocaleDateString();

  //parse the response for name of city and concatenating the date and icon.
  $(currentCity).html(
    response.name +
      " (" +
      date +
      ")" +
      "<img src='" +
      iconurl +
      "' alt='Weather Icon'>"
  );

  // parse the response to display the current temperature.
  var tempF = (response.main.temp - 273.15) * 1.8 + 32;
  $(currentTemperature).html(tempF.toFixed(1) + "°F");

  // Display the Humidity
  $(currentHumidty).html(response.main.humidity + "%");

  //Display Wind speed and convert to MPH
  var ws = response.wind.speed;
  var windsmph = (ws * 2.237).toFixed(1);
  $(currentWSpeed).html(windsmph + " MPH");

  // Display UVIndex.
  UVIndex(response.coord.lon, response.coord.lat);

  // Add fade-in animation to weather card
  $("#current-weather").addClass("fade-in-up");
}

// Add location to history if not exists
function addLocationToHistory(cityName) {
  sCity = JSON.parse(localStorage.getItem("cityname")) || [];

  if (find(cityName) > 0) {
    sCity.push(cityName.toUpperCase());
    localStorage.setItem("cityname", JSON.stringify(sCity));
    addToList(cityName);
  }
}

// searches the city to see if it exists in the entries from the storage
function find(c) {
  for (var i = 0; i < sCity.length; i++) {
    if (c.toUpperCase() === sCity[i]) {
      return -1;
    }
  }
  return 1;
}

// Display the current and future weather to the user after grabbing the city from the input text box.
function displayWeather(event) {
  event.preventDefault();
  var searchValue = searchCity.val().trim();
  if (searchValue !== "") {
    city = searchValue;
    showLoading();
    currentWeather(city);
  } else {
    showNotification("Please enter a city name", "warning");
    // Add shake animation to search input
    searchCity.addClass("shake");
    setTimeout(function () {
      searchCity.removeClass("shake");
    }, 600);
  }
}

// Handle Enter key press in search input
searchCity.on("keypress", function (event) {
  if (event.which === 13) {
    // Enter key
    displayWeather(event);
  }
});

// Here we create the AJAX call
function currentWeather(city) {
  // Here we build the URL so we can get data from server side.
  var queryURL =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    city +
    "&APPID=" +
    APIKey;
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function (response) {
      console.log(response);

      // Display weather data
      displayWeatherData(response);
      forecast(response.id);

      if (response.cod == 200) {
        addLocationToHistory(city);
      }

      // Clear search input
      searchCity.val("");
      hideLoading();
      showNotification(`Weather updated for ${response.name}`, "success");
    })
    .catch(function (error) {
      console.error("Error fetching weather data:", error);
      hideLoading();
      showNotification(
        "City not found. Please check the spelling and try again.",
        "error"
      );

      // Add shake animation to search input
      searchCity.addClass("shake");
      setTimeout(function () {
        searchCity.removeClass("shake");
      }, 600);
    });
}

// This function returns the UVIndex response.
function UVIndex(ln, lt) {
  //lets build the url for uvindex.
  var uvqURL =
    "https://api.openweathermap.org/data/2.5/uvi?appid=" +
    APIKey +
    "&lat=" +
    lt +
    "&lon=" +
    ln;
  $.ajax({
    url: uvqURL,
    method: "GET",
  })
    .then(function (response) {
      var uvValue = parseFloat(response.value);
      $(currentUvindex).html(uvValue.toFixed(1));
      setUVIndexColor(uvValue);
    })
    .catch(function (error) {
      console.error("Error fetching UV data:", error);
      $(currentUvindex).html("N/A");
    });
}

// Here we display the 5 days forecast for the current city.
function forecast(cityid) {
  var queryforcastURL =
    "https://api.openweathermap.org/data/2.5/forecast?id=" +
    cityid +
    "&appid=" +
    APIKey;
  $.ajax({
    url: queryforcastURL,
    method: "GET",
  })
    .then(function (response) {
      for (i = 0; i < 5; i++) {
        var date = new Date(
          response.list[(i + 1) * 8 - 1].dt * 1000
        ).toLocaleDateString();
        var iconcode = response.list[(i + 1) * 8 - 1].weather[0].icon;
        var iconurl = "https://openweathermap.org/img/wn/" + iconcode + ".png";
        var tempK = response.list[(i + 1) * 8 - 1].main.temp;
        var tempF = ((tempK - 273.15) * 1.8 + 32).toFixed(1);
        var humidity = response.list[(i + 1) * 8 - 1].main.humidity;

        $("#fDate" + i).html(date);
        $("#fImg" + i).html("<img src='" + iconurl + "' alt='Weather Icon'>");
        $("#fTemp" + i).html(tempF + "°F");
        $("#fHumidity" + i).html(humidity + "%");

        // Add animation to forecast cards with delay
        setTimeout(
          function (index) {
            $("#fDate" + index)
              .closest(".forecast-card")
              .addClass("fade-in-up");
          },
          i * 100,
          i
        );
      }

      hideLoading();
    })
    .catch(function (error) {
      console.error("Error fetching forecast data:", error);
      hideLoading();
      showNotification("Unable to load forecast data", "warning");
    });
}

//Dynamically add the passed city to the search history
function addToList(c) {
  var listEl = $("<li>" + c.toUpperCase() + "</li>");
  $(listEl).attr("class", "list-group-item");
  $(listEl).attr("data-value", c.toUpperCase());
  $(".search-history").append(listEl);

  // Add animation
  listEl.addClass("slide-in-right");
}

// display the past search again when the list group item is clicked in search history
function invokePastSearch(event) {
  var liEl = event.target;
  if (event.target.matches("li")) {
    city = liEl.textContent.trim();
    showLoading();
    currentWeather(city);
  }
}

// Load last city from history
function loadLastCity() {
  $(".search-history").empty();
  var sCity = JSON.parse(localStorage.getItem("cityname"));

  if (sCity !== null && sCity.length > 0) {
    // Rebuild search history with staggered animation
    for (i = 0; i < sCity.length; i++) {
      setTimeout(
        function (index, cityName) {
          addToList(cityName);
        },
        i * 100,
        i,
        sCity[i]
      );
    }

    // Load the most recent city
    city = sCity[sCity.length - 1];
    showLoading();
    currentWeather(city);
    showNotification(`Loading weather for ${city}`, "info");
    return true;
  }
  return false;
}

// Load a default city if no history exists
function loadDefaultCity() {
  var defaultCities = ["New York", "London", "Tokyo", "Sydney"];
  var randomCity =
    defaultCities[Math.floor(Math.random() * defaultCities.length)];

  showLoading();
  currentWeather(randomCity);
  showNotification(`Loading weather for ${randomCity}`, "info");
}

//Clear the search history from the page
function clearHistory(event) {
  event.preventDefault();
  sCity = [];
  localStorage.removeItem("cityname");

  // Animate out each history item
  $(".search-history .list-group-item").each(function (index) {
    var item = $(this);
    setTimeout(function () {
      item.fadeOut(300, function () {
        item.remove();
      });
    }, index * 50);
  });

  // Clear current weather display with animation
  $("#current-weather").fadeOut(300, function () {
    $(currentCity).html("");
    $(currentTemperature).html("");
    $(currentHumidty).html("");
    $(currentWSpeed).html("");
    $(currentUvindex).html("");
    $(this).fadeIn(300);
  });

  // Clear forecast with staggered animation
  for (var i = 0; i < 5; i++) {
    setTimeout(
      function (index) {
        var card = $("#fDate" + index).closest(".forecast-card");
        card.fadeOut(200, function () {
          $("#fDate" + index).html("");
          $("#fImg" + index).html("");
          $("#fTemp" + index).html("");
          $("#fHumidity" + index).html("");
          card.fadeIn(200);
        });
      },
      i * 100,
      i
    );
  }

  showNotification("Search history cleared successfully", "success");
}

// Initialize app with enhanced animations
function initializeApp() {
  // Start the real-time clock
  startClock();

  // Add initial animations with delays for premium feel
  setTimeout(function () {
    $(".sidebar-card").addClass("slide-in-left");
  }, 200);

  setTimeout(function () {
    $(".weather-card").addClass("fade-in-up");
  }, 400);

  setTimeout(function () {
    $(".datetime-display").addClass("fade-in-up");
  }, 100);

  // Try to load last searched city first
  if (!loadLastCity()) {
    // If no search history, show welcome message
    setTimeout(function () {
      showNotification(
        "Welcome! Search for a city or use your current location",
        "info"
      );
    }, 1000);
  }
}

//Click Handlers
$("#search-button").on("click", displayWeather);
$("#location-button").on("click", getCurrentLocation);
$(document).on("click", invokePastSearch);
$(window).on("load", initializeApp);
$("#clear-history").on("click", clearHistory);

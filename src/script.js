var map = new L.Map('map', {
  center: [47, 8],
  maxBounds: [[45, 4], [48,11]],
  minZoom: 7,
  maxZoom: 18,
  zoom: 8
});

// Light OSM layer
var osmLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
}).addTo(map);


// Which isochrones to calculate? (in seconds)
var cutoffSec = [1800, 3600];
var fromPlace = [46.6274, 10.4462];

// Get the isochrone polygons from the OTP server
// The request URL for 30 and 60 minutes isochrones
// by public transportation is something like:
//
// http://130.223.67.145:8080/otp/routers/ch/isochrone?
//    fromPlace=47.243,8.7774&
//    mode=WALK,TRANSIT&
//    date=11-14-2018&
//    time=8:00am&
//    maxWalkDistance=1500&
//    cutoffSec=1800&
//    cutoffSec=3600
function getIsochrones(){
  // The cutoffSec parameter in the URL is repeated which is a
  // non-standard behaviour. cutoffSec[]=1800&cutoffSec[]=3600
  // does not work. Build this part of the URL manually.
  var cutoffSecParam = cutoffSec.map(function(v) { return 'cutoffSec=' + v; }).join('&');

  $.ajax({
    url: 'http://130.223.67.145:8080/otp/routers/ch/isochrone?' + cutoffSecParam,
    type: 'GET',
    dataType: 'json',
    data: {
      fromPlace: fromPlace.join(','),
      mode: 'TRANSIT,WALK',
      maxWalkDistance: 1500
    },
    success: drawIsochrone,
    error: isochroneError
  });
}

function drawIsochrone(data){

  if (data.features.length == 0) {
    alert('No isochrone found.');
    return;
  }

  var colors = {
    1800: '#756bb1',
    3600: '#bcbddc'
  };

  isochrones = L.geoJSON(data, {
      style: function(feature){
        return { 
          fillColor: colors[feature.properties.time],
          color: '#ffffff',
          weight: 0.5,
          fillOpacity: 0.5
        };
      }
    }).addTo(map);

  isochrones.bindTooltip(
    function(e) {
      var t = e.feature.properties.time;
      return (t/60) + ' minutes';
    },
    {
      sticky: true, 
      opacity: 0.5
    }
  ).addTo(map);


  // Add the from point location as a marker.
  var origin = L.circleMarker(
    fromPlace,
    {
      color: '#000000',
      fillOpacity: 0.5,
      fillColor: '#ff0000'
    }
  ).addTo(map);


  // Zoom to the isochrones extent.
  map.flyToBounds(isochrones.getBounds());
}

function isochroneError(error){
  alert('Error during isochrone calculation.');
  console.log('Isochrone error', error);
}



getIsochrones();

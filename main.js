/**
 * main.js
 * 
 * This is the entrypoint for the scripting on the Transparent Troy website.
 * All other scripts should be auxiliary to this.
 */

// Imports
import { TROY_CENTER, TROY_POLYGON, councilDistrictFeatures } from "./etl.js";
import districtData from './data/district_info.json' with { type: 'json' };

/**
 * MAPPING
 */

// UTILITY FUNCTIONS
// TODO: Flesh out the types of these a lot more:

/**
 * Takes in a point of any format and returns a very specific type
 * TODO:
 * @param {*} point 
 */
// function normalizePoint(point)

/**
 * Returns whether a point is in the northwest quadrant.
 * We do not support locations outside of the northwest quadrant.
 * We can be certain we have an invalid point if the latitutde and longitude 
 *  have the same sign (northeast or southwest), but we cannot distinguish between northwest and southeast.
 * We just assume that a passing point is in the northwest, as we do not support southeast.
 * 
 * @param {*} point 
 * @returns {Boolean} Whether the point is in the northwest quadrant.
 */
function isNorthEast(point) {
    // multiplying opposing signs will yield negative result
    return point[0] * point[1] > 0;
}

/**
 * Takes in a point~ and returns it in lat,long format,
 * even if it already was in that format (idempotent).
 * 
 * TODO: Define exactly what types qualify as a "point~" and what the exact return type is
 *      Should it return the same type or a standarized type?
 * 
 */
function toLatLong(point) {
    if (isNorthEast(point)) {
        console.error(`Coordinate ${point} is not in the northwest (or southeast) quadrant. 
            Either the coordinate was passed improperly, or the location is not supported by the app.`);
        return;
    }

    // Northwest quadrant should have negative longitude, positive latitude
    
    // Longitude is first
    if (point[0] < 0) return point.toReversed();

    // Latitude is first
    return point;
}

/**
 * Takes in a point~ and returns it in long,lat format,
 * even if it already was in that format (idempotent).
 * 
 * TODO: Define exactly what types qualify as a "point~" and what the exact return type is
 *      Should it return the same type or a standarized type?
 * 
 */
function toLongLat(point) {
    if (isNorthEast(point)) {
        console.error(`Coordinate ${point} is not in the northwest (or southeast) quadrant. 
            Either the coordinate was passed improperly, or the location is not supported by the app.`);
        return;
    }

    // Northwest quadrant should have negative longitude, positive latitude
    
    // Longitude is first
    if (point[1] < 0) return point.toReversed();

    // Latitude is first
    return point;
}

// This Leaflet marker will always show the user's selected/current position
let marker = null;
/**
 * 
 * @param {*} point coordinates of where the marker should be updated to
 * @param {Boolean} [flyTo=false] whether or not to use the Leaflet `flyTo()` function to zoom on the point
 * @param {Number} [precision] The radius (in meters) from the point to draw a confidence circle around
 */
function updateMarker(point, flyTo, precision) {
    // Draw marker
    if (marker) {
        // If the marker already exists on the map, just update the coordiantes.
        marker.setLatLng(point);
    } else {
        // If it doesn't exist, create it and add it to the map
        marker = L.marker(point).addTo(map);
    }

    // Draw precision circle
    if (precision) {
        L.circle(point, {radius: precision}).addTo(map);
    }

    // Fly to (smooth zoom) the point if desired
    if (flyTo) {
        // TODO: Maybe make the zoom level determined by the accuracy? A smaller number -> larger zoom?
        map.flyTo(point, zoomLevel + 1);
    }

}

// Display map
const zoomLevel = 12
var map = L.map('map').setView(TROY_CENTER.geometry.coordinates.toReversed(), zoomLevel);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Draw districts
function districtClickHandler(feature, layer) {
    // Bind the click event to each individual feature layer
    layer.on('click', function (e) {
        updateMarker(e.latlng);
        renderDistrictInfo(feature.properties.district);
    });
}

L.geoJSON(TROY_POLYGON, {
    style: {
        color: '#3e916e',
        weight: 1,
        fillOpacity: 0.4
    },
}).addTo(map);

L.geoJSON(councilDistrictFeatures, {
    style: {
        color: '#d10e0e',
        weight: 5,
        fillOpacity: 0.4
    },
    onEachFeature: districtClickHandler
}).addTo(map);


// Geolocation
document.getElementById("geolocation").addEventListener("click", event => {
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, {enableHighAccuracy: false});
})

document.getElementById("return").addEventListener("click", event => {
    // TODO: only display when you choose a location outside troy or just scroll away from troy
    map.flyTo(TROY_CENTER.geometry.coordinates.toReversed(), zoomLevel);
});
/**
 * 
 * @param {Number[]} coordinates The coordinates the user is either currently at or has requested manually (via address or raw coordinates)
 * @returns {Number} The district number the coordinates fall in. -1 if it does not match any. Note that this is 1-6, for use as an index, you may want to subtract 1.
 */
function getDistrictFromCoords(coordinates) {
    console.log("Finding the district for:", coordinates);
    // TODO: Check if coordinates is a turf.js point or a regular array
    const point = turf.point(coordinates);
    const district = councilDistrictFeatures.features.find(district =>
        turf.booleanPointInPolygon(point, district)
    )?.properties.district;

    if (!district) return -1;

    return district;
}

function renderDistrictInfo(districtNumber) {
    // Display the info box forever once it is shown once.
    document.querySelector(".district-info").hidden = false;
    // TODO: A11Y needs aria alert polite or smth...

    const districtObj = districtData[districtNumber];
    const infoSection = document.querySelector(".district-info section");
    const emptyMessage = document.querySelector(".district-info p");
    const $ = selector => infoSection.querySelector(selector);

    if (!districtObj) {
        emptyMessage.hidden = false;
        infoSection.hidden = true;
    } else {
        emptyMessage.hidden = true;
        infoSection.hidden = false;

        $(".district-number").textContent = districtNumber;
        $(".councilmember").textContent = `${districtObj.member.firstName} ${districtObj.member.lastName}`;
        $(".phone-number").textContent = districtObj.member.phoneNumber;
        $(".address").textContent = districtObj.member.address;
        $(".portrait").src = districtObj.member.image;
        $(".portrait").alt = `Councilmember ${districtObj.member.firstName} ${districtObj.member.lastName}`;
    }
}

function locationSuccess(position) {
    console.log("Successfully got position:", JSON.stringify(position.toJSON()));
    const posArray = [position.coords.latitude, position.coords.longitude];
    // Add center to map for TESTING
    const testPosArray = TROY_CENTER.geometry.coordinates.toReversed();
    // Determine what district the user is in.
    const districtNumber = getDistrictFromCoords(posArray.toReversed());
    updateMarker(posArray, true, position.coords.accuracy);

    renderDistrictInfo(districtNumber);
    // TODO: Consider accuracy radius.
}

function locationError(posError) {
    console.warn("Failed to get location:", posError.code, posError.message);
    // TODO: display message to user based on denial permissions
    // TODO: Use a <geolocation> HTML element when widely supported. https://caniuse.com/wf-geolocation-element

    switch(posError.code) {
        // https://w3c.github.io/geolocation/#constants
        case 1: // PERMISSION_DENIED
            console.warn("The user did not want to share");
            break;
        case 2: // POSITION_UNAVAILABLE
            console.error("Something went wrong");
            break;
        case 3: // TIMEOUT
            console.error("Took too long");
            break;
        default:
            console.error("We hit none of these cases");
    }
}
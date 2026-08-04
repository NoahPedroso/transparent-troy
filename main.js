/**
 * main.js
 * 
 * This is the entrypoint for the scripting on the Transparent Troy website.
 * All other scripts should be auxiliary to this.
 */

// Imports
import { TROY_CENTER, TROY_POLYGON, councilDistrictFeatures } from "./etl.js";
/**
 * MAPPING
 */

// Display map
const zoomLevel = 12
console.log(TROY_CENTER.geometry.coordinates);
var map = L.map('map').setView(TROY_CENTER.geometry.coordinates.toReversed(), zoomLevel);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Draw districts

// TODO: this function should show the info for each city council member 
function addFeatureInfo(feature, layer) {
    layer.bindPopup(`Council District: ${feature.properties.district}`);
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
    onEachFeature: addFeatureInfo
}).addTo(map);
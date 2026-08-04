/**
 * main.js
 * 
 * This is the entrypoint for the scripting on the Transparent Troy website.
 * All other scripts should be auxiliary to this.
 */


// Constants
const DATA_FILENAME = 'data/troy_eds.geojson';
// TODO: Calculate the "true" center based on coordinates
const TROY_CENTER = Object.freeze({
    latitude:   42.731259,
    longitute: -73.691695
});
/* TODO: Calculate the "true" centers of each district.
    Could be helpful to create quicklinks 
    (e.g. transparenttroy.com/?d=4) that start with that district centered */  
// Types
/**
 * @import {GeoJson, ElectionDistrict} from "./types/geojson.js"
 */

/**
 * Groups the rows from the ED data by which city countil district they are in
 * @param {Array<Object>} electionDistricts the rows in the ED data
 */
function groupByCouncilDistrict(electionDistricts) {
    return Object.groupBy(electionDistricts, (ed) => ed.councilDistrict);
}


/**
 * Return only the relevant data to us from the raw JSON file from the county.
 * Could be an easy one liner, but splitting into multiple lines allows good logging for understanding and debugging
 *  Hence we will keep it in a function
 * @param {GeoJson} rawData
 * @returns {ElectionDistrict[]}
 */
function transformFeatures(rawData) {
    console.log("FEATURE TRANSFORMATION STEP 0: Raw Data:", rawData);

    const fullFeatures = rawData.features.filter(potentialFeature => potentialFeature.type == "Feature");
    console.log("FEATURE TRANSFORMATION STEP 1: Only Verified Features", fullFeatures);

    const transformedFeatures = fullFeatures.map(feature => ({
        edId: feature.properties.ED,
        councilDistrict: feature.properties.CNCLDIST,
        coordinates: feature.geometry.coordinates,
    }));
    console.log("FEATURE TRANSFORMATION STEP 2: Only Desired Attributes", transformedFeatures);
    
    return transformedFeatures;

    // One liner just for demo (never called)
    return rawData.features.filter(potentialFeature => potentialFeature.type = "Feature")
                           .map(feature => ({
                                edId: feature.properties.ED,
                                councilDistrict: feature.properties.CNCLDIST,
                                coordinates: feature.geometry.coordinates,
                            }));
}

/**
 * DATA MANIPULATION
 */

// Import the geojson data
const rawData = await fetch(DATA_FILENAME).then(res=>res.json());
console.log("Raw imported data:", rawData);

// Grab only the features, and relevant data
const electionDistricts = transformFeatures(rawData);
console.log("Election Districts:", electionDistricts);

// Create groups of EDs by CD
const groupedDistricts = groupByCouncilDistrict(electionDistricts);
console.log("Grouped Districts:", groupedDistricts);


/* Use turf.js to create unified polygons of the borders of groups of EDs. 
    NOTE: https://github.com/w8r/martinez may be better here (smaller) */
const councilDistrictFeatures = turf.featureCollection([]);
Object.entries(groupedDistricts).forEach(([key, val]) => {
    // Assuming that the key looks like "NTH", we extract the N 
    // TODO: Add verification that the data looks like this
    const councilDistrictNumber = key[0];
    councilDistrictFeatures.features.push(turf.union(
        turf.featureCollection(val.map(ed => turf.polygon(ed.coordinates))),
        {
            // Keep council district in feature properties. Any other useful info is tied to council district number
            properties: {
                district: Number(councilDistrictNumber)
            }
        })
    );
});
console.log("Unioned features:", councilDistrictFeatures);

/**
 * MAPPING
 */

// Display map
const zoomLevel = 15
var map = L.map('map').setView([TROY_CENTER.latitude, TROY_CENTER.longitute], zoomLevel);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Draw districts

// TODO: this function should show the info for each city council member 
function addFeatureInfo(feature, layer) {
    layer.bindPopup(`Council District: ${feature.properties.district}`);
}

L.geoJSON(councilDistrictFeatures, {
    style: {
        color: '#d10e0e',
        weight: 1,
        fillOpacity: 0.4
    },
    onEachFeature: addFeatureInfo
}).addTo(map);
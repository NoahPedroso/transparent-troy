/**
 * etl.js
 * 
 * 
 * This file handles all the preprocessing of the raw geoJSON data
 * None of this needs to happen on the fly and is the same for all users
 * ETL = Extract, Transform, Load (this is mostly "Transform")
 */

// Constants
const DATA_FILENAME = 'data/troy_eds.geojson';

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
 * Any manual corrections to the data are done here.
 * These are NOT derivations or filtering. This is changing the ACTUAL data.
 * A reason must be provided for anything in this function. It should ideally remain VERY small.
 * Perhaps in the future, if there are glaring issues, the issues here could be reported up to the source.
 * 
 * For now I only need to edit the data that I actually use, 
 * but perhaps in the future for some reason I may need to switch this to accept rawData before any processing.
 * 
 * @param {ElectionDistrict[]} electionDistricts
 * @returns {ElectionDistrict[]}
 */
function correctData(electionDistricts) {
    /** CORRECTION 1: Election districts are not perfectly contiguous
     * 
     *  EXPLANATION: The points on the election district polygons are not always shared on boundaries where two disticts meet. For example,
     *      Example:
     *      *-*-*
     *      |1|2|
     *      *-*-* 
     *      Here, districts 1 and 2 both share a point on their borders: (1,1). This makes it clear they can merge (`turf.union()`).
     *      The error we are correcting here occurs when district one's point is something like (0.99, 0.99) and district 2's is like (1.01, 1.01).
     *      The points are so close to each other so it is clear that the two points are close enough that they should be the same, but for some reason the data has them slightly off.
     *  
     *  DISCOVERY METHOD: Observed stray border lines in the middle of city council districts created by merging city council districts.
     * 
     *  FIX: Overwrite one of the bad coordinates to the other district's value.
     *  WHY THIS IS ACCEPTABLE: The distance between the original coordinate and the coordinate I am overwriting it with is small (< 1ft).
     *      Checked manually as there were only 2 instances and the data does not change often.
     */
    // SIDE EFFECT: sorting input. ok for now, but good to remember.
    // Convert to num because localeCompare orders 1,10,11,...,2,20...
    // .find() is O(N), sort then index is O(NlogN). May be worth timing though, as these are smallish arrays and there may be hidden constants
    const ed11 = electionDistricts.find(ed => ed.edId === "TY_11");
    const ed12 = electionDistricts.find(ed => ed.edId === "TY_12");
    ed12.coordinates[0][47] = ed11.coordinates[0][29];
    ed12.coordinates[0][40] = ed11.coordinates[0][36];

    return electionDistricts;
}

/**
 * DATA MANIPULATION
 */

// Import the geojson data
const rawData = await fetch(DATA_FILENAME).then(res=>res.json());
console.log("Raw imported data:", rawData);

// Grab only the features, and relevant data
const electionDistricts = correctData(transformFeatures(rawData));
console.log("Election Districts:", electionDistricts);

// Create groups of EDs by CD
const groupedDistricts = groupByCouncilDistrict(electionDistricts);
console.log("Grouped Districts:", groupedDistricts);


/* Use turf.js to create unified polygons of the borders of groups of EDs. 
    NOTE: https://github.com/w8r/martinez may be better here (smaller) */
let councilDistrictFeatures = turf.featureCollection([]);
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

/**********************************
 *            EXPORTS             *
 **********************************/
// Polygon Features
export {councilDistrictFeatures};
export const TROY_POLYGON = turf.union(councilDistrictFeatures);
// Point Features
export const TROY_CENTER = turf.center(TROY_POLYGON); 
/* Could be helpful to create quicklinks (e.g. transparenttroy.com/?d=4)
    that start with that district centered */
export const DISTRICT_CENTERS = councilDistrictFeatures.features.sort((a, b) => a.properties.district - b.properties.district)
                                                        .map(feature => turf.center(feature));
/* Unsure if it is ideal to use these instead of just the array indices or an object with keys. 
    Commenting out for now because I think it is a bad idea actually. */
// export const DISTRICT_1_CENTER = districtCenters[0];
// export const DISTRICT_2_CENTER = districtCenters[1];
// export const DISTRICT_3_CENTER = districtCenters[2];
// export const DISTRICT_4_CENTER = districtCenters[3];
// export const DISTRICT_5_CENTER = districtCenters[4];
// export const DISTRICT_6_CENTER = districtCenters[5];
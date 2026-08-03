/**
 * geojson.js
 * 
 * These types are used by the transformation process 
 * from raw data, sourced from Rensselaer County,
 * to a usable structure for the app.
 * 
 * GeoJSON is not a Rensselaer County created format, see the definition here:
 * https://geojson.org/
 * NOTE: With TS, I probably shouldn't write this myself.
 */


/************************************
 * Types as sent by Rensselaer County
 ************************************/
/**
 * @typedef {Object} FeatureProperties
 * @property {string} ED
 * @property {string} CNCLDIST
 */

/**
 * @typedef {Object} FeatureGeometry
 * @property {"Polygon"} type
 * @property {number[][][]} coordinates
 */

/**
 * @typedef {Object} GeoFeature
 * @property {"Feature"} type
 * @property {FeatureProperties} properties
 * @property {FeatureGeometry} geometry
 */

/**
 * @typedef {Object} GeoJson
 * @property {GeoFeature[]} features
 */


/************************************
 * Custom Output Type
 ************************************/
/**
 * @typedef {Object} ElectionDistrict
 * @property {string} edId
 * @property {string} councilDistrict
 * @property {number[][][]} coordinates
 */


// Dummy export
export {};
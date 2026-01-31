// Data Cleaning Utilities
// Functions for cleaning and validating data

function cleanData(data) {
  if (!data || typeof data !== "object") return data;

  // Remove sensitive or inappropriate content
  const forbidden = ["curse", "damn", "evil", "hopeless"];
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") {
      if (forbidden.some((word) => data[key].toLowerCase().includes(word))) {
        data[key] = "[Content filtered for faith alignment]";
      }
    }
  });

  // Ensure timestamps are valid
  if (data.timestamp) {
    data.timestamp = new Date(data.timestamp).toISOString();
  }

  return data;
}

function validateData(data, schema) {
  // Basic validation - extend as needed
  if (!data.timestamp) {
    data.timestamp = new Date().toISOString();
  }
  return data;
}

module.exports = { cleanData, validateData };

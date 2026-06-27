/**
 * Configuration constants and default values.
 *
 * @namespace CONFIG
 */
export const CONFIG = {
  /** @type {number} Default number of workout rounds when none specified */
  DEFAULT_ROUNDS: 10,

  /** @type {number} Minimum allowed number of workout rounds */
  MIN_ROUNDS: 1,

  /** @type {number} Maximum allowed number of workout rounds */
  MAX_ROUNDS: 100,

  /** @type {number} Default number of workout rounds before changing the exercise category */
  DEFAULT_CATEGORY_CHANGE: 1,

  /** @type {number} Minimum allowed workout rounds before changing the exercise category */
  MIN_CATEGORY_CHANGE: 1,

  /** @type {number} Maximum allowed workout rounds before changing the exercise category */
  MAX_CATEGORY_CHANGE: 100,

  /** @type {string} Path to the JSON file containing the exercise categories */
  CATEGORIES_FILE: "./assets/json/ExerciseCategories.json",

  /** @type {string} Path to the JSON file containing the exercises */
  EXERCISES_FILE: "./assets/json/Exercises.json",
};

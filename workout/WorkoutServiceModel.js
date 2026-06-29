import { CONFIG } from "../js/Config.js";
import { ExerciseEntityModel } from "./ExerciseEntityModel.js";
import { ExerciseCategoryValueModel } from "./ExerciseCategoryValueModel.js";

/**
 * Service for loading workout data, managing workout settings,
 * validating configuration, and generating workout sequences
 */
export class WorkoutServiceModel {
  #selectedExerciseCategories;
  #selectedExerciseRounds = CONFIG.DEFAULT_ROUNDS;
  #selectedCategoryChange = CONFIG.DEFAULT_CATEGORY_CHANGE;
  #availableExercises;

  /**
   * Creates a new workout service instance
   *
   * @class
   */
  constructor() {
    this.#selectedExerciseCategories = this.loadExerciseCategoriesFromDb();
    this.#availableExercises = this.loadExercisesFromDb();
  }

  /**
   * Loads and sanitizes exercise categories from the database (JSON file)
   *
   * @returns {Promise<ExerciseCategoryValueModel[]>}
   */
  async loadExerciseCategoriesFromDb() {
    const response = await fetch(CONFIG.CATEGORIES_FILE);
    const json = this.#sanitizeJSON(await response.json());

    return json.exerciseCategories.map(
      (cat) => new ExerciseCategoryValueModel(cat.name, cat.emoji),
    );
  }

  /**
   * Gets the selected exercise categories
   *
   * @returns {Promise<ExerciseCategoryValueModel[]>}
   */
  getExerciseCategories() {
    return this.#selectedExerciseCategories;
  }

  /**
   * Toggles whether a category is included in the selected workout categories
   *
   * @param {ExerciseCategoryValueModel} selectedCategory Category to add or remove
   * @returns {Promise<void>}
   */
  async updateExerciseCategories(selectedCategory) {
    const categories = await this.#selectedExerciseCategories;
    const index = categories.indexOf(selectedCategory);

    if (index >= 0) {
      categories.splice(index, 1);
    } else {
      categories.push(selectedCategory);
    }
  }

  /**
   * Gets the current number of exercise rounds
   *
   * @returns {number}
   */
  getExerciseRounds() {
    return this.#selectedExerciseRounds;
  }

  /**
   * Sets the number of exercise rounds, limited to configured thresholds
   *
   * @param {number} rounds Requested number of rounds
   * @returns {void}
   */
  setExerciseRounds(rounds) {
    const newValue = Number(rounds);

    if (!Number.isInteger(newValue)) return;

    this.#selectedExerciseRounds = Math.min(
      Math.max(newValue, CONFIG.MIN_ROUNDS),
      CONFIG.MAX_ROUNDS,
    );
  }

  /**
   * Increases the number of exercise rounds by one, limited to configured thresholds.
   * Returns the new number.
   *
   * @returns {number}
   */
  increaseExerciseRounds() {
    if (this.#selectedExerciseRounds < CONFIG.MAX_ROUNDS) {
      this.#selectedExerciseRounds += 1;
    }
    return this.#selectedExerciseRounds;
  }

  /**
   * Decreases the number of exercise rounds by one, limited to configured thresholds.
   * Returns the new number.
   *
   * @returns {number}
   */
  decreaseExerciseRounds() {
    if (this.#selectedExerciseRounds > CONFIG.MIN_ROUNDS) {
      this.#selectedExerciseRounds -= 1;
    }
    return this.#selectedExerciseRounds;
  }

  /**
   * Gets the rounds-before-category-change value
   *
   * @returns {number}
   */
  getCategoryChange() {
    return this.#selectedCategoryChange;
  }

  /**
   * Sets the rounds-before-category-change value, limited to configured thresholds
   *
   * @param {number} roundsBeforeChange Requested number of round as category-change interval
   * @returns {void}
   */
  setCategoryChange(roundsBeforeChange) {
    const newValue = Number(roundsBeforeChange);

    if (!Number.isInteger(newValue)) return;

    this.#selectedCategoryChange = Math.min(
      Math.max(newValue, CONFIG.MIN_CATEGORY_CHANGE),
      CONFIG.MAX_CATEGORY_CHANGE,
    );
  }

  /**
   * Increases the category-change interval by one, limited to configured thresholds.
   * Returns the new number.
   *
   * @returns {number}
   */
  increaseCategoryChange() {
    if (this.#selectedCategoryChange < CONFIG.MAX_CATEGORY_CHANGE) {
      this.#selectedCategoryChange += 1;
    }
    return this.#selectedCategoryChange;
  }

  /**
   * Decreases the category-change interval by one, limited to configured thresholds.
   * Returns the new number.
   *
   * @returns {number}
   */
  decreaseCategoryChange() {
    if (this.#selectedCategoryChange > CONFIG.MIN_CATEGORY_CHANGE) {
      this.#selectedCategoryChange -= 1;
    }
    return this.#selectedCategoryChange;
  }

  /**
   * Loads and sanitizes exercises from the database (JSON file)
   *
   * @returns {Promise<ExerciseEntityModel[]>}
   */
  async loadExercisesFromDb() {
    const categories = await this.#selectedExerciseCategories;
    const response = await fetch(CONFIG.EXERCISES_FILE);
    const json = this.#sanitizeJSON(await response.json());

    return json.exercises.map((ex) => {
      const category = categories.find((cat) => cat.getName() === ex.category);

      return new ExerciseEntityModel(ex.name, ex.description, category);
    });
  }

  /**
   * Generates a set of exercise based on the current workout configuration
   *
   * @returns {Promise<ExerciseEntityModel[]>}
   * @throws {Error} String of error messages. Available if the configuration is invalid.
   */
  async generateWorkout() {
    const validation = await this.#validateConfiguration();
    if (!validation.isValid) {
      throw new Error(validation.errors);
    }

    // Shuffle the selected categories
    const selectedCategories = this.#shuffleArray([
      ...(await this.#selectedExerciseCategories),
    ]);

    // Per category, create a map with an empty array that will be filled with selectable exercises
    const exercisePool = new Map(selectedCategories.map((cat) => [cat, []]));

    const workoutExercises = new Array(this.#selectedExerciseRounds);
    let filledRounds = 0;
    let currentCategoryIndex = 0;

    while (filledRounds < workoutExercises.length) {
      const currentCategory = selectedCategories[currentCategoryIndex];
      const roundsToFillForCurrentCategory = Math.min(
        workoutExercises.length - filledRounds,
        this.#selectedCategoryChange,
      );

      for (let i = 0; i < roundsToFillForCurrentCategory; i++) {
        // If there are no more exercises available for the current category, refill the array
        if (exercisePool.get(currentCategory).length === 0) {
          exercisePool
            .get(currentCategory)
            .push(
              ...(await this.#availableExercises).filter((exercise) =>
                exercise.getCategory().equals(currentCategory),
              ),
            );
        }

        // Randomly pick an exercise from the pool and add it to the workout series
        const poolCurrentCat = exercisePool.get(currentCategory);
        const exerciseChosenIndex = Math.floor(
          Math.random() * poolCurrentCat.length,
        );

        workoutExercises[filledRounds++] = poolCurrentCat.splice(
          exerciseChosenIndex,
          1,
        )[0];
      }

      // Increment the category index
      currentCategoryIndex =
        (currentCategoryIndex + 1) % selectedCategories.length;
    }

    return workoutExercises;
  }

  /**
   * Recursively sanitizes strings inside a JSON-like object
   *
   * @param {*} obj JSON-like object to sanitize
   * @returns {*}
   * @private
   */
  #sanitizeJSON(obj) {
    if (typeof obj === "string") {
      return String(obj)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.#sanitizeJSON(item));
    }

    if (obj !== null && typeof obj === "object") {
      const sanitized = {};

      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          sanitized[key] = this.#sanitizeJSON(obj[key]);
        }
      }

      return sanitized;
    }

    return obj;
  }

  /**
   * Shuffles an array in place
   *
   * @param {Array} array Array to shuffle
   * @returns {Array}
   * @private
   * @see {@link https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array}
   */
  #shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  /**
   * Validates the current workout configuration
   *
   * @returns {Promise<{isValid: boolean, errors: string}>}
   */
  async #validateConfiguration() {
    const categories = await this.#selectedExerciseCategories;
    const errors = [];

    if (!categories || categories.length === 0) {
      errors.push("Select at least one exercise category.");
    }

    if (
      this.#selectedExerciseRounds < CONFIG.MIN_ROUNDS ||
      this.#selectedExerciseRounds > CONFIG.MAX_ROUNDS
    ) {
      errors.push(
        `Number of rounds must be between ${CONFIG.MIN_ROUNDS} and ${CONFIG.MAX_ROUNDS}.`,
      );
    }

    if (
      this.#selectedCategoryChange < CONFIG.MIN_CATEGORY_CHANGE ||
      this.#selectedCategoryChange > CONFIG.MAX_CATEGORY_CHANGE
    ) {
      errors.push(
        `Rounds before category change must be between ${CONFIG.MIN_CATEGORY_CHANGE} and ${CONFIG.MAX_CATEGORY_CHANGE}.`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors: errors.join(" "),
    };
  }
}

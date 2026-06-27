import { CONFIG } from "../js/Config.js";
import { ExerciseEntityModel } from "./ExerciseEntityModel.js";
import { ExerciseCategoryValueModel } from "./ExerciseCategoryValueModel.js";

export class WorkoutServiceModel {
  constructor() {
    this.selectedExerciseCategories = this.readExerciseCategoriesFromDb();
    this.selectedExerciseRounds = CONFIG.DEFAULT_ROUNDS;
    this.selectedCategoryChange = CONFIG.DEFAULT_CATEGORY_CHANGE;
    this.availableExercises = this.readExercisesFromDb();
  }

  async readExerciseCategoriesFromDb() {
    return fetch(CONFIG.CATEGORIES_FILE)
      .then((response) => response.json())
      .then((json) => this.sanitizeJSONObject(json))
      .then((json) => {
        let categories = [];
        json.exerciseCategories.forEach((cat) => {
          categories.push(new ExerciseCategoryValueModel(cat.name, cat.emoji));
        });

        return categories;
      });
  }

  getExerciseCategories() {
    return this.selectedExerciseCategories;
  }

  async updateExerciseCategories(selectedCategory) {
    let categories = await this.selectedExerciseCategories;

    if (categories.includes(selectedCategory)) {
      categories.splice(categories.indexOf(selectedCategory), 1);
    } else {
      categories.push(selectedCategory);
    }
  }

  getExerciseRounds() {
    return this.selectedExerciseRounds;
  }

  setExerciseRounds(rounds) {
    const newRounds = Number(rounds);

    if (Number.isInteger(newRounds)) {
      if (newRounds >= CONFIG.MIN_ROUNDS && newRounds <= CONFIG.MAX_ROUNDS) {
        this.selectedExerciseRounds = newRounds;
      } else if (newRounds < CONFIG.MIN_ROUNDS) {
        this.selectedExerciseRounds = CONFIG.MIN_ROUNDS;
      } else {
        this.selectedExerciseRounds = CONFIG.MAX_ROUNDS;
      }
    }
  }

  increaseExerciseRounds() {
    if (this.selectedExerciseRounds < CONFIG.MAX_ROUNDS) {
      this.selectedExerciseRounds = this.selectedExerciseRounds + 1;
    }
    return this.selectedExerciseRounds;
  }

  decreaseExerciseRounds() {
    if (this.selectedExerciseRounds > CONFIG.MIN_ROUNDS) {
      this.selectedExerciseRounds = this.selectedExerciseRounds - 1;
    }
    return this.selectedExerciseRounds;
  }

  getCategoryChange() {
    return this.selectedCategoryChange;
  }

  setCategoryChange(roundsBeforeChange) {
    const newRoundsBeforeChange = Number(roundsBeforeChange);

    if (Number.isInteger(newRoundsBeforeChange)) {
      if (
        newRoundsBeforeChange >= CONFIG.MIN_ROUNDS &&
        newRoundsBeforeChange <= CONFIG.MAX_ROUNDS
      ) {
        this.selectedCategoryChange = newRoundsBeforeChange;
      } else if (newRoundsBeforeChange < CONFIG.MIN_ROUNDS) {
        this.selectedCategoryChange = CONFIG.MIN_CATEGORY_CHANGE;
      } else {
        this.selectedCategoryChange = CONFIG.MAX_CATEGORY_CHANGE;
      }
    }
  }

  increaseCategoryChange() {
    if (this.selectedCategoryChange < CONFIG.MAX_CATEGORY_CHANGE) {
      this.selectedCategoryChange = this.selectedCategoryChange + 1;
    }
    return this.selectedCategoryChange;
  }

  decreaseCategoryChange() {
    if (this.selectedCategoryChange > CONFIG.MIN_CATEGORY_CHANGE) {
      this.selectedCategoryChange = this.selectedCategoryChange - 1;
    }
    return this.selectedCategoryChange;
  }

  async readExercisesFromDb() {
    const categories = await this.selectedExerciseCategories;

    return fetch(CONFIG.EXERCISES_FILE)
      .then((response) => response.json())
      .then((json) => this.sanitizeJSONObject(json))
      .then((json) => {
        let exercises = [];
        json.exercises.forEach((ex) => {
          const category = categories.find(
            (cat) => cat.getName() === ex.category,
          );

          exercises.push(
            new ExerciseEntityModel(ex.name, ex.description, category),
          );
        });

        return exercises;
      });
  }

  async generateWorkout() {
    const validation = await this.validateConfiguration();
    if (!validation.isValid) {
      throw new Error(validation.errors);
    }

    // Filter the exercises by category + shuffle relevant exercises
    const selectedCategories = this.shuffleArray(
      await this.selectedExerciseCategories,
    );

    // Create an array for each category with the exercises that are still available to choose from.
    // "Still available" means that the exercises have not been included in the workout yet;
    // at least in the last [category.length] exercises.
    // Each array is initial filled during the first iteration of the corresponding category below.
    const exercisesToChooseFrom = new Map();
    selectedCategories.forEach((cat) => {
      exercisesToChooseFrom.set(cat, []);
    });

    const workoutExercises = new Array(this.selectedExerciseRounds);
    let filledRounds = 0;
    let currentCategoryIndex = 0;

    while (filledRounds < workoutExercises.length) {
      const currentCategory = selectedCategories[currentCategoryIndex];
      const roundsToFillForCurrentCategory = Math.min(
        workoutExercises.length - filledRounds,
        this.selectedCategoryChange,
      );

      for (let i = 0; i < roundsToFillForCurrentCategory; i++) {
        // When there are no more exercises to choose from,
        // shuffle all exercises in the current category and refill the array with them.
        // This occurs when the workout requires more exercises from the category than are available in the category.
        if (exercisesToChooseFrom.get(currentCategory).length === 0) {
          exercisesToChooseFrom
            .get(currentCategory)
            .push(
              ...(await this.availableExercises).filter((exercise) =>
                exercise.category.equals(currentCategory),
              ),
            );
        }

        // Randomly choose (and remove) an exercise from the array and add it to the workout series.
        const exerciseChosenIndex = Math.floor(
          Math.random() * exercisesToChooseFrom.get(currentCategory).length,
        );

        const exerciseChosen = exercisesToChooseFrom
          .get(currentCategory)
          .splice(exerciseChosenIndex, 1)[0];

        workoutExercises[filledRounds++] = exerciseChosen;
      }

      // Increment the category index
      currentCategoryIndex =
        (currentCategoryIndex + 1) % selectedCategories.length;
    }

    return workoutExercises;
  }

  /**
   * Sanitizes a string by escaping HTML entities.
   *
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string with HTML entities escaped
   * @private
   */
  sanitizeJSON(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Recursively sanitizes all string values in a JSON object.
   *
   * @param {*} obj - Object, array, or primitive value to sanitize
   * @returns {*} Sanitized version of the input with all strings escaped
   * @private
   */
  sanitizeJSONObject(obj) {
    if (typeof obj === "string") {
      return this.sanitizeJSON(obj);
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeJSONObject(item));
    } else if (obj !== null && typeof obj === "object") {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeJSONObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj; // Return as-is for non-string, non-object, non-array values
  }

  /**
   * Randomly shuffles array elements using Fisher-Yates algorithm.
   * Modifies the original array in place.
   *
   * @param {Array} array - Array to shuffle
   * @returns {Array} The same array reference, now shuffled
   * @see {@link https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array}
   * @example
   * const numbers = [1, 2, 3, 4, 5];
   * WorkoutService.shuffleArray(numbers); // numbers is now shuffled
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async validateConfiguration() {
    let errors = "";
    const categories = await this.selectedExerciseCategories;

    if (!categories || categories.length === 0) {
      errors += "Select at least one exercise category. ";
    }

    if (
      this.selectedExerciseRounds < CONFIG.MIN_ROUNDS ||
      this.selectedExerciseRounds > CONFIG.MAX_ROUNDS
    ) {
      errors += `Number of rounds must be between ${CONFIG.MIN_ROUNDS} and ${CONFIG.MAX_ROUNDS}. `;
    }

    if (
      this.selectedCategoryChange < CONFIG.MIN_CATEGORY_CHANGE ||
      this.selectedCategoryChange > CONFIG.MAX_CATEGORY_CHANGE
    ) {
      errors += `Rounds before category change must be between ${CONFIG.MIN_CATEGORY_CHANGE} and ${CONFIG.MAX_CATEGORY_CHANGE}. `;
    }

    return {
      isValid: errors === "",
      errors,
    };
  }
}

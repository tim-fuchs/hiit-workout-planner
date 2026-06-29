/**
 * Entity representing a single exercise
 */
export class ExerciseEntityModel {
  #name;
  #description;
  #category;

  /**
   * Creates a new exercise object
   *
   * @class
   * @param {string} name Exercise name
   * @param {string} description Exercise description
   * @param {ExerciseCategoryValueModel} category Exercise category
   */
  constructor(name, description, category) {
    this.#name = name;
    this.#description = description;
    this.#category = category;
  }

  /**
   * Returns the exercise name
   *
   * @returns {string}
   */
  getName() {
    return this.#name;
  }

  /**
   * Returns the exercise description
   *
   * @returns {string}
   */
  getDescription() {
    return this.#description;
  }

  /**
   * Returns the exercise category
   *
   * @returns {ExerciseCategoryValueModel}
   */
  getCategory() {
    return this.#category;
  }
}

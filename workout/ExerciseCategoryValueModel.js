/**
 * Value object representing an exercise category
 */
export class ExerciseCategoryValueModel {
  #name;
  #emoji;

  /**
   * Creates a new category object
   *
   * @class
   * @param {string} name Category name
   * @param {string} emoji Category emoji
   */
  constructor(name, emoji) {
    this.#name = name;
    this.#emoji = emoji;
  }

  /**
   * Returns the category name
   *
   * @returns {string}
   */
  getName() {
    return this.#name;
  }

  /**
   * Returns the category emoji
   *
   * @returns {string}
   */
  getEmoji() {
    return this.#emoji;
  }

  /**
   * Compares the equality of this category and another category
   *
   * @param {ExerciseCategoryValueModel} exerciseCategoryValue Category to compare
   * @returns {boolean}
   */
  equals(exerciseCategoryValue) {
    return this.#name === exerciseCategoryValue.getName();
  }
}

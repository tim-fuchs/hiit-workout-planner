import { WorkoutServiceModel } from "./WorkoutServiceModel.js";

/**
 * Controller of the workout planner component. Renders the view and connects the UI controls to the model.
 */
export class WorkoutController {
  #workoutService;

  /**
   * Creates the controller instance by instantiating the model and initializing the view
   *
   * @class
   */
  constructor() {
    this.#workoutService = new WorkoutServiceModel();
    this.#initializeView();
  }

  /**
   * Loads the workout view and wires all UI controls to the model
   *
   * @returns {Promise<void>}
   */
  async #initializeView() {
    // Render the initial workout view
    const response = await fetch("./workout/WorkoutView.html");
    const html = await response.text();
    document.getElementById("workout").innerHTML = html;

    // Render the exercise category checkboxes and connect them to the model
    const exerciseCategories =
      await this.#workoutService.getExerciseCategories();

    document.getElementById("exerciseCategories").innerHTML = exerciseCategories
      .map(
        (cat) =>
          `<label><input type="checkbox" id="${cat.getName()}" checked />${cat.getEmoji()} ${cat.getName()}</label>`,
      )
      .join("");

    exerciseCategories.forEach((cat) => {
      document.getElementById(cat.getName()).addEventListener("click", () => {
        this.#workoutService.updateExerciseCategories(cat);
      });
    });

    // Connect the exercise-round input field and +/- buttons to the model
    const roundsInput = document.getElementById("rounds");

    roundsInput.value = this.#workoutService.getExerciseRounds();

    roundsInput.addEventListener("input", (event) => {
      this.#workoutService.setExerciseRounds(event.target.value);
    });

    document.getElementById("roundsIncrease").addEventListener("click", () => {
      roundsInput.value = this.#workoutService.increaseExerciseRounds();
    });

    document.getElementById("roundsDecrease").addEventListener("click", () => {
      roundsInput.value = this.#workoutService.decreaseExerciseRounds();
    });

    // Connect the category-change input field and +/- buttons to the model
    const categoryChangeInput = document.getElementById("categoryChange");

    categoryChangeInput.value = this.#workoutService.getCategoryChange();

    categoryChangeInput.addEventListener("input", (event) => {
      this.#workoutService.setCategoryChange(event.target.value);
    });

    document
      .getElementById("categoryChangeIncrease")
      .addEventListener("click", () => {
        categoryChangeInput.value =
          this.#workoutService.increaseCategoryChange();
      });

    document
      .getElementById("categoryChangeDecrease")
      .addEventListener("click", () => {
        categoryChangeInput.value =
          this.#workoutService.decreaseCategoryChange();
      });

    // Connect the generate workout button to the model and handle
    // displaying the generated workout and any error messages
    document
      .getElementById("workoutForm")
      .addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
          const exercises = await this.#workoutService.generateWorkout();

          const tableRows = exercises
            .map(
              (ex) =>
                `<tr><td>${ex.getCategory().getEmoji()}</td><td>${ex.getName()}</td></tr>`,
            )
            .join("");

          document.getElementById("workoutOutput").innerHTML =
            `<table class="striped exercise-list"><tbody>${tableRows}</tbody></table>`;

          document.getElementById("errorMessages").innerHTML = `<div></div>`;
        } catch (error) {
          document.getElementById("errorMessages").innerHTML =
            `<div class="error-message">${error}</div>`;

          document.getElementById("workoutOutput").innerHTML = `<div></div>`;
        }
      });
  }
}

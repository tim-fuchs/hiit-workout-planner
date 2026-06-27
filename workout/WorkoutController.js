import { WorkoutServiceModel } from "./WorkoutServiceModel.js";

export class WorkoutController {
  constructor() {
    this.workoutService = new WorkoutServiceModel();
    this.initializeView();
  }

  async initializeView() {
    await fetch("./workout/WorkoutView.html")
      .then((response) => response.text())
      .then((html) => {
        document.getElementById("workout").innerHTML = html;
      });

    const exerciseCategories =
      await this.workoutService.getExerciseCategories();

    document.getElementById("exerciseCategories").innerHTML = exerciseCategories
      .map(
        (cat) =>
          `<label><input type="checkbox" id="${cat.name}" checked />${cat.emoji} ${cat.name}</label>`,
      )
      .join("");

    exerciseCategories.forEach((cat) => {
      document.getElementById(cat.name).addEventListener("click", () => {
        this.workoutService.updateExerciseCategories(cat);
      });
    });

    const roundsInput = document.getElementById("rounds");

    roundsInput.value = this.workoutService.getExerciseRounds();

    roundsInput.addEventListener("input", (event) => {
      this.workoutService.setExerciseRounds(event.target.value);
    });

    document.getElementById("roundsIncrease").addEventListener("click", () => {
      document.getElementById("rounds").value =
        this.workoutService.increaseExerciseRounds();
    });

    document.getElementById("roundsDecrease").addEventListener("click", () => {
      document.getElementById("rounds").value =
        this.workoutService.decreaseExerciseRounds();
    });

    const categoryChangeInput = document.getElementById("categoryChange");

    categoryChangeInput.value = this.workoutService.getCategoryChange();

    categoryChangeInput.addEventListener("input", (event) => {
      this.workoutService.setCategoryChange(event.target.value);
    });

    document
      .getElementById("categoryChangeIncrease")
      .addEventListener("click", () => {
        document.getElementById("categoryChange").value =
          this.workoutService.increaseCategoryChange();
      });

    document
      .getElementById("categoryChangeDecrease")
      .addEventListener("click", () => {
        document.getElementById("categoryChange").value =
          this.workoutService.decreaseCategoryChange();
      });

    document
      .getElementById("workoutForm")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        this.workoutService
          .generateWorkout()
          .then((exercises) => {
            const tableRows = exercises
              .map(
                (ex) =>
                  `<tr><td>${ex.category.emoji}</td><td>${ex.name}</td></tr>`,
              )
              .join("");

            document.getElementById("workoutOutput").innerHTML =
              `<table class="striped exercise-list"><tbody>${tableRows}</tbody></table>`;

            document.getElementById("errorMessages").innerHTML = `<div></div>`;
          })
          .catch((errors) => {
            document.getElementById("errorMessages").innerHTML =
              `<div class="error-message">${errors}</div>`;
          });
      });
  }
}

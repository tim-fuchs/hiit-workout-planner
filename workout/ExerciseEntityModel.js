export class ExerciseEntityModel {
  constructor(name, description, category) {
    this.name = name;
    this.description = description;
    this.category = category;
  }

  getName() {
    return this.name;
  }

  getDescription() {
    return this.description;
  }

  getCategory() {
    return this.category;
  }
}

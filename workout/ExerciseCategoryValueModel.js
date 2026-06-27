export class ExerciseCategoryValueModel {
  constructor(name, emoji) {
    this.name = name;
    this.emoji = emoji;
  }

  getName() {
    return this.name;
  }

  getEmoji() {
    return this.emoji;
  }

  equals(ExerciseCategoryValue) {
    let equalCategories = false;

    if (this.name == ExerciseCategoryValue.getName()) {
      equalCategories = true;
    }

    return equalCategories;
  }
}

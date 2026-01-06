import studentChoiceDto from "./studentChoiceDto.js";

export default class studentQuestionDto {
    constructor(question) {
        this.questionId = question.questionId;
        this.text = question.text;
        this.type = question.type;

        this.order = question.ClassEvaluationQuestion?.order;
        this.points = question.ClassEvaluationQuestion?.points;

        this.choices = question.Choices
            ? question.Choices.map(c => new studentChoiceDto(c))
            : [];
    }
}
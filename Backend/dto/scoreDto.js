export default class ScoreDto {
    constructor(responseSheet) {
    this.score = responseSheet.score;
    this.evaluationType = responseSheet.Evaluation.type;
  }
}
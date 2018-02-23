const Severity = {
  TRIVIAL: { adjective: "trivial", adverb: "trivially" },
  SLIGHT: { adjective: "slight", adverb: "slightly" },
  MODEST: { adjective: "modest", adverb: "modestly" },
  MODERATE: { adjective: "moderate", adverb: "moderately" },
  SEVERE: { adjective: "severe", adverb: "severely" },
  SERIOUS: { adjective: "serious", adverb: "seriously" }
};

const Degree = {
  TRIVIAL: { adjective: "somewhat", adverb: "somewhat" },
  SLIGHT: { adjective: "slight", adverb: "slightly" },
  MODEST: { adjective: "modest", adverb: "modestly" },
  MODERATE: { adjective: "moderate", adverb: "moderately" },
  GREAT: { adjective: "great", adverb: "greatly" },
  SERIOUS: { adjective: "exceptional", adverb: "exceptionally" }
};

const Advantage = {
  PRETTY_GOOD: { adjective: "pretty good", adverb: "pretty well" },
  GOOD: { adjective: "good", adverb: "well" },
  REALLY_GOOD: { adjective: "really good", adverb: "really well" },
  GREAT: { adjective: "great", adverb: "great" },
  OUTSTANDING: { adjective: "outstanding", adverb: "outstanding" }
};

const Difficulty = {
  EASY: { adjective: "simple" },
  NORMAL: { adjective: "slightly challenging" },
  MODERATE: { adjective: "challenging" },
  DIFFICULT: { adjective: "difficult" },
  VERY_DIFFICULT: { adjective: "very difficult" },
  EXTREMELY_DIFFICULT: { adjective: "extremely difficult" }
};

const VOWELS = ["a", "e", "i", "o", "u"];

const Language = {
  aOrAn(word) {
    return VOWELS.includes(word.charAt(0)) ? "an" : "a";
  },

  getSeverityAdjective(value) {
    return this.getSeverity(value).adjective;
  },

  getSeverityAdverb(value) {
    return this.getSeverity(value).adverb;
  },

  getSeverity(value) {
    if (value <= 5) return Severity.TRIVIAL;
    if (value <= 15) return Severity.SLIGHT;
    if (value <= 25) return Severity.MODEST;
    if (value <= 35) return Severity.MODERATE;
    if (value <= 50) return Severity.SEVERE;
    return Severity.SERIOUS;
  },

  getDegreeAdjective(value) {
    return this.getDegree(value).adjective;
  },

  getDegreeAdverb(value) {
    return this.getDegree(value).adverb;
  },

  getDegree(value) {
    if (value <= 5) return Degree.TRIVIAL;
    if (value <= 15) return Degree.SLIGHT;
    if (value <= 25) return Degree.MODEST;
    if (value <= 35) return Degree.MODERATE;
    if (value <= 50) return Degree.GREAT;
    return Degree.SERIOUS;
  },

  getAdvantageAdjective(value) {
    return this.getAdvantage(value).adjective;
  },

  getAdvantageAdverb(value) {
    return this.getAdvantage(value).adverb;
  },

  getAdvantage(value) {
    if (value <= 105) return Advantage.PRETTY_GOOD;
    if (value <= 120) return Advantage.GOOD;
    if (value <= 130) return Advantage.REALLY_GOOD;
    if (value <= 145) return Advantage.GREAT;
    return Advantage.OUTSTANDING;
  },

  getDifficultyAdjective(successProbability) {
    return this.getDifficulty(successProbability).adjective;
  },

  getDifficulty(successProbability) {
    if (successProbability >= 100) return Difficulty.EASY;
    if (successProbability >= 75) return Difficulty.NORMAL;
    if (successProbability >= 50) return Difficulty.MODERATE;
    if (successProbability >= 25) return Difficulty.DIFFICULT;
    if (successProbability >= 5) return Difficulty.VERY_DIFFICULT;
    return Difficulty.EXTREMELY_DIFFICULT;
  },

  /**
   * Swaps the beginning of the first two words to create a spoonerism
   */
  spoonerize(words) {
    // Can only spoonerize if there are multiple words
    if (words.length < 2) return words;

    // Split words into two parts, where the first part goes up to and includes the first vowel
    var regex = /([bcdfghjklmnpqrstvwxy]*[aeiou])(.*)/i;
    for (let i = 0; i < 2; i++) {
      let matches = regex.exec(words[i]);
      words[i] = [matches[1], matches.length > 2 ? matches[2] : ""];
    }

    // Swap the first parts of the first two words
    var swap = words[0][0];
    words[0][0] = words[1][0];
    words[1][0] = swap;

    for (let i = 0; i < 2; i++)
      words[i] = words[i].join("");

    return words;
  }
};

export default Language;

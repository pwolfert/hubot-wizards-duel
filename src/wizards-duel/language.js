
const Severity = {
	TRIVIAL:  { adjective: 'trivial',  adverb: 'trivially'  },
	SLIGHT:   { adjective: 'slight',   adverb: 'slightly'   },
	MODEST:   { adjective: 'modest',   adverb: 'modestly'   },
	MODERATE: { adjective: 'moderate', adverb: 'moderately' },
	SEVERE:   { adjective: 'severe',   adverb: 'severely'   },
	SERIOUS:  { adjective: 'serious',  adverb: 'seriously'  },
};

const Difficulty = {
	EASY:                { adjective: 'simple' },
	MODERATE:            { adjective: 'challenging' },
	DIFFICULT:           { adjective: 'difficult' },
	VERY_DIFFICULT:      { adjective: 'very difficult' },
	EXTREMELY_DIFFICULT: { adjective: 'extremely difficult' },
};


const Language = {

	getSeverityAdjective(value) {
		return this.getSeverity(value).adjective;
	},

	getSeverityAdverb(value) {
		return this.getSeverity(value).adverb;
	},

	getSeverity(value) {
		if (value <= 0.05)
			return Severity.TRIVIAL;
		if (value <= 0.15)
			return Severity.SLIGHT;
		if (value <= 0.25)
			return Severity.MODEST;
		if (value <= 0.35)
			return Severity.MODERATE;
		if (value <= 0.50)
			return Severity.SEVERE;
		return Severity.SERIOUS;
	},

	getDifficultyAdjective(successProbability) {
		return this.getDifficulty(successProbability).adjective;
	},

	getDifficulty(successProbability) {
		if (value >= 1)
			return Difficulty.EASY;
		if (value >= 0.75)
			return Difficulty.MODERATE;
		if (value >= 0.50)
			return Difficulty.DIFFICULT;
		if (value >= 0.25)
			return Difficulty.VERY_DIFFICULT;
		return Difficulty.EXTREMELY_DIFFICULT;
	}

};

export default Language;
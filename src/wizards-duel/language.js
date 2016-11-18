
const TRIVIAL  = 1;
const SLIGHT   = 2;
const MODEST   = 3;
const MODERATE = 4;
const SEVERE   = 5;
const SERIOUS  = 6;

const Language = {

	getSeverityAdjective(value) {

	},

	getSeverityAdverb(value) {

	},

	_getSeverity(value) {
		if (value <= 0.05)
			return TRIVIAL;
		if (value <= 0.15)
			return SLIGHT;
		if (value <= 0.25)
			return MODEST;
		if (value <= 0.35)
			return MODERATE;
		if (value <= 0.50)
			return SEVERE;
		return SERIOUS;
	}

}

export default Language;


var Set = {

	add: function(array, item) {
		if (array.indexOf(item) === -1)
			array.push(item);
	},

	remove: function(array, item) {
		var index = array.indexOf(item)
		if (index !== -1)
			array.splice(index, 1);
	},

	contains: function(array, item) {
		return (array.indexOf(item) !== -1);
	}

};

module.exports = Set;

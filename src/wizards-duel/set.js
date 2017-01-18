import _ from 'lodash';

var SetFunctions = {

	add(array, item) {
		if (_.isArray(item)) {
			for (let i of item)
				this._addOne(array, i);
		}
		else
			this._addOne(array, item);
	},

	_addOne(array, item) {
		if (array.indexOf(item) === -1)
			array.push(item);
	},

	remove(array, item) {
		var index = array.indexOf(item);
		if (index !== -1)
			array.splice(index, 1);
	},

	includes(array, item) {
		return (array.indexOf(item) !== -1);
	},

};

export default SetFunctions;

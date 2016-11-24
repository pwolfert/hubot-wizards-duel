// Description:
//   Allows hubot to facilitate wizards' duels
//
// Commands:
//   I challenge @<username> to a wizards duel! - Challenges another user to a duel
//
// Author:
//   pwolfert
//

import Manager from './wizards-duel/manager';

class HubotWrapper {

	constructor(robot) {
		this.robot = robot;
		this.database = robot.brain;
		this.manager = new Manager(database, () => {
			return this.output;
		});
		this.outputBuffers = [];
	}

	get output() {
		if (this.outputBuffers.length)
			return this.outputBuffers[this.outputBuffers.length - 1];
		else
			throw new Error('No output buffer has been started.');
	}

}

export default function(robot) {

	var manager = new Manager();

};

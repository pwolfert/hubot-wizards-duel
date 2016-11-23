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
		this.robot
		this.output = {

		}
		this.manager = new Manager()
	}

	get output() {

	}

}

export default function(robot) {

	var manager = new Manager();

};

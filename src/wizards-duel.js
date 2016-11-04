// Description:
//   Allows hubot to facilitate wizards' duels
//
// Commands:
//   I challenge @<username> to a wizards duel! - Challenges another user to a duel
//
// Author:
//   pwolfert
//

var effects = require('./wizards-duel/effects.js');
var spells  = require('./wizards-duel/spells.js');
var Manager = require('./wizards-duel/manager.js');

module.exports = function (robot) {

	var manager = new Manager(robot);

};

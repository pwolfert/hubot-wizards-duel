// Description:
//   Allows hubot to facilitate wizards' duels
//
// Commands:
//   I challenge @<username> to a wizards duel! - Challenges another user to a duel
//
// Author:
//   pwolfert
//

import Manager from "./wizards-duel/manager";

export default function(robot) {
  var manager = new Manager(robot);
}

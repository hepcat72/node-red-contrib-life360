const life360 = require('../index.js');

var session;
var updated_locations = {};
var updated_location_names = {};
var numCheck = 0;

function isSet(value) {
    return typeof value !== 'undefined' && value != null;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

module.exports = function (RED) {
    class ServerNode {
        constructor(n) {
            RED.nodes.createNode(this, n);
            var node = this;

            node.username = n.username;
            node.password = n.password;

            node.valueChangedCallbacks = {};
            node.callbacksEnabled = {};

            this.onChange = function (nodeId, callback) {
                this.valueChangedCallbacks[nodeId] = callback;
                this.callbacksEnabled[nodeId] = true;
            };

            this.onLocationDisable = function(nodeId) {
                if(this.callbacksEnabled[nodeId]) {
                    //The location node has either been deleted or disabled, so don't call it back.
                    //If it was deleted, it should go fully away the next time node red restarts.
                    this.callbacksEnabled[nodeId] = false;
                }
            }

            if (node.username && node.password) {
                node.updateLife360();
                setInterval(function () {
                    node.updateLife360();
                }, 15000);
            }
        }

        updateSession(callback) {
            var node = this;
            if (!session) {
                life360.authenticate(node.username, node.password).then(s => {
                    session = s;
                    callback(session);
                });
            } else {
                return callback(session);
            }
        }

        sendChanged(circle, numCheck) {
            let node = this;
            let circleName = circle.name;
            let members = circle.members;
            let circleId = circle.id;

            if (isSet(members)) {

                //
                // Update saved locations, detect changes, and count location
                // populations before these changes occurred
                //

                let prevLocations = {};
                let prevLocationNames = {};
                let locPopBefore = {};
                let movedMembers = {};
                let changed = false;
                for (var i = 0; i < members.length; i++) {
                    let member = members[i];
                    let locationName = member.location.name;
                    let locationId = member.location.sourceId; 
                    let oldLocationId = null;
                    let oldLocationName = null;
                    if (updated_locations[circleId] && updated_locations[circleId][member.id]) {
                        oldLocationId = updated_locations[circleId][member.id];
                        oldLocationName = updated_location_names[circleId][member.id]; 
                        if(isSet(oldLocationId)) {
                            if(isSet(locPopBefore[oldLocationId])) {
                                locPopBefore[oldLocationId]++;
                            } else {
                                locPopBefore[oldLocationId] = 1;
                            }
                        }
                    }

                    if ((oldLocationId && !locationId) || (!oldLocationId && locationId) ||
                        (locationId && oldLocationId && oldLocationId !== locationId)) {
                        changed = true;
                        prevLocations[member.id] = oldLocationId;
                        prevLocationNames[member.id] = oldLocationName;
                        movedMembers[member.id] = member;
                    }

                    if ( updated_locations[circleId] ) {
                        updated_locations[circleId][member.id] = locationId;
                        updated_location_names[circleId][member.id] = locationName;
                    } else {
                        updated_locations[circleId] = {};
                        updated_locations[circleId][member.id] = locationId;
                        updated_location_names[circleId] = {};
                        updated_location_names[circleId][member.id] = locationName;
                    }
                }

                if(changed) {
                    //For all the members of this circle who changed locations
                    for (const [memberId, movedMember] of Object.entries(movedMembers)) {

                        let prevLocId = prevLocations[memberId];
                        let curLocId = movedMember.location.sourceId;

                        let status = movedMember.firstName + " " + movedMember.lastName + " ";

                        //Set the population of the previous location before departure
                        let numPrevLocBefore = 0;
                        if(isSet(prevLocId)) {

                            status += "left " + prevLocationNames[memberId];

                            if(isSet(locPopBefore[prevLocId])) {
                                numPrevLocBefore = locPopBefore[prevLocId];
                                //Update for the next loop iteration
                                //Can prob assume this, but just to be on the safe side...
                                if(locPopBefore[prevLocId] > 0) {
                                    locPopBefore[prevLocId]--;
                                }
                            }
                        }

                        //Set the population of the current location before arrival
                        let numCurLocBefore = 0;
                        if(isSet(curLocId)) {

                            if(isSet(prevLocId)) {
                                status += " and ";
                            }
                            status += " arrived at " + movedMember.location.name;
                            if(isSet(locPopBefore[curLocId])) {
                                numCurLocBefore = locPopBefore[curLocId];
                                //Update for the next loop iteration
                                locPopBefore[curLocId]++;
                            } else {
                                //This happens when the location is not in updated_locations yet
                                locPopBefore[curLocId] = 1;
                            }
                        }

                        node.sendMember(status, numCheck, movedMember, circleId, prevLocId, curLocId, numPrevLocBefore, numCurLocBefore);
                    }
                } else {
                   let status = "Checking location. (" + numCheck + ")";
                   node.sendMember(status, null, null, null, null, null, null, null); 
                }
            }
        }

        updateCircles(circles) {
            var node = this;
            numCheck++;
            for (var i = 0; i < circles.length; i++) {
                let circle = circles[i];
                let circleId = circle['id'];
                node.getCircle(circleId, function (circle) {
                    node.sendChanged(circle, numCheck);
                });
            }
        }

        getCircle(circleId, callback) {
            life360.circle(session, circleId).then(circle => {
                callback(circle);
            });
        }

        updateLife360() {
            var node = this;
            return node.updateSession(function (session) {
                life360.circles(session)
                    .then(circles => {
                        if (circles.length == 0) {
                            throw new Error("No circles in your Life360.");
                        }
                        node.updateCircles(circles);
                    })
            });
        }

        getCircles() {
            var node = this;
            return node.updateSession(function (session) {
                return life360.circles(session)
                    .then(circles => {
                        return circles;
                    })
            });
        }

        getPeople(circleId, callback) {
            var node = this;
            
            return life360.members(session, circleId).then(members => {
                callback(members);
            });
        }

        getPlaces(circleId, callback) {
            var node = this;

            return life360.places(session, circleId).then(places => {
                callback(places);
            });
        }

        sendMember(status_msg, numCheck, member, circleId, prevLocId, curLocId, numPrevLocBefore, numCurLocBefore) {
            var node = this;

            let cbexists = false;
            for(const [locationNodeId, callback] of Object.entries(node.valueChangedCallbacks)) {
                if(node.callbacksEnabled[locationNodeId]) {
                    callback(status_msg, numCheck, member, circleId, prevLocId, curLocId, numPrevLocBefore, numCurLocBefore);
                    cbexists = true;
                }
            }
            if(!cbexists) {
                node.warn("No callbacks");
            }
        }
    }

    RED.nodes.registerType("life360-server", ServerNode);
};

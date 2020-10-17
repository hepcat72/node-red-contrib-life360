const life360 = require('../index.js');

var session;
var updated_locations = {};

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

            node.valueChangedCallback = null;

            this.onChange = function (callback) {
                this.valueChangedCallback = callback;
            };

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

        sendChanged(circle, firstTime) {
            let node = this;
            let circleName = circle.name;
            let members = circle.members;
            let circleId = circle.id;

            if (isSet(members)) {
                for (var i = 0; i < members.length; i++) {
                    let member = members[i];
                    //let locationName = circleName + ": " + member.location.name;
                    let locationName = member.location.name;
                    let oldLocationName = null;
                    if (updated_locations[circleId] && updated_locations[circleId][member.id]) {
                        oldLocationName = updated_locations[circleId][member.id]; 
                    }

                    if ((oldLocationName && !locationName) || (!oldLocationName && locationName) || (locationName && oldLocationName && oldLocationName !== locationName)) {
                        //node.warn("First? " + firstTime + " CHANGE   : " + member.firstName + " in circle " + circleName + " has New location: " + locationName + " differs from old location: " + oldLocationName + " item " + circleId + "." + member.id);
                        node.sendMember(member, firstTime);
                    }

                    if ( updated_locations[circleId] ) {
                        updated_locations[circleId][member.id] = locationName;
                    } else {
                        updated_locations[circleId] = {};
                        updated_locations[circleId][member.id] = locationName;
                    }
                    //node.warn("Saved location: " + updated_locations[circleId][member.id] + " for " + member.firstName + " in circle " + circleName + " should be " + locationName);
                }
            }
        }

        updateCircles(circles) {
            var node = this;
            let firstTime = isEmpty(updated_locations);
            for (var i = 0; i < circles.length; i++) {
                let circle = circles[i];
                let circleId = circle['id'];
                node.getCircle(circleId, function (circle) {
                    node.sendChanged(circle, firstTime);
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

        sendMember(member, firstTime) {
            var node = this;
            if (!member) {
                node.warn("No member");
                return;
            }

            if (this.valueChangedCallback) {
                this.valueChangedCallback(member, firstTime);
            } else {
                node.warn("No callback");
            }
        }
    }

    RED.nodes.registerType("life360-server", ServerNode);
};

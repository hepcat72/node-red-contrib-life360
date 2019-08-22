const Scanner = require('../life360.js');

module.exports = function (RED) {
    class LocationNode {
        constructor(config) {
            RED.nodes.createNode(this, config);

            console.log(config);

            var node = this;
            node.config = config;
            node.server = new Scanner(config.email, config.password);
            node.server.on('newLocation', (location) => this.sendLocation(location));
            node.server.on('newCircle', (circle) => this.sendCircle(circle));
            node.server.on('newMember', (member) => this.sendMember(member));
        }

        sendLocation(location, force = false) {
            var node = this;
            if (!location) {
                return;
            }

            //outputs
            node.send([{
                payload: location
            }]);
        }

        sendMember(member, force = false) {
            var node = this;
            if (!member) {
                return;
            }

            //outputs
            node.send([{
                payload: member
            }]);
        }

        sendCircle(circle, force = false) {
            var node = this;
            if (!circle) {
                return;
            }

            //outputs
            node.send([{
                payload: circle
            }]);
        }
    }

    RED.nodes.registerType("location", LocationNode, {});
};
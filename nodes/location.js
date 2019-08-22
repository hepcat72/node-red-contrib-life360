const Scanner = require('../life360.js');

module.exports = function (RED) {
    class LocationNode {
        constructor(config) {
            RED.nodes.createNode(this, config);

            console.log(config);

            var node = this;
            node.config = config;
            node.server = new Scanner(config.email, config.password);
            // node.server.on('newLocation', (name) => this.sendLocation(name));
            node.server.on('newCircle', (circle) => this.sendCircle(circle));
        }

        sendLocation(name, force = false) {
            var node = this;
            if (!name) {
                return;
            }

            //outputs
            node.send([{
                payload: name
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
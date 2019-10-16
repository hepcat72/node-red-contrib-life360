module.exports = function (RED) {
    class LocationNode {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            node.config = config;

            node.status({

            }); //clean

            //get server node
            node.server = RED.nodes.getNode(node.config.server);
            if (node.server) {

            } else {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "Server is required"
                });
            }

            node.server.onChange(function (member) {
                node.sendMemeber(member);
            });
        }

        sendMemeber(member) {
            var node = this;
            if (!member) {
                return;
            }

            if (node.config.outputAtStartup || node.sended) {
                //outputs
                node.send([{
                    payload: member
                }]);

                node.status({
                    fill: "green",
                    shape: "dot",
                    text: member.location.name
                });
            } else {
                node.sended = true;
                node.status({
                    fill: "yellow",
                    shape: "ring",
                    text: "Waiting for location change."
                });
            }
        };
    }

    RED.nodes.registerType("location", LocationNode, {});
};
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

            node.server.onChange(function (member, numCheck) {
                node.sendMemeber(member, numCheck);
            });
        }

        sendMemeber(member, numCheck) {
            var node = this;

            if (!!member) {
                if(node.config.outputAtStartup || numCheck > 1) {
                    node.warn("Sending " + member.firstName + ", " + member.location.name);
                    //outputs
                    node.send([{
                        payload: member
                    }]);
                }

                let whereName = member.location.name;
                if (!whereName) {
                    whereName = "Unnamed Place";
                }

                node.status({
                    fill: "green",
                    shape: "dot",
                    text: whereName
                });
            } else {
                let wtmsg = "Checking location. (" + numCheck + ")";
                node.status({
                    fill: "yellow",
                    shape: "ring",
                    text: wtmsg
                });
            }
        };
    }

    RED.nodes.registerType("location", LocationNode, {});
};

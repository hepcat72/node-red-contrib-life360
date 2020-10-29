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

    // Make all the available circle info accessible for the node's config screen
    //Note: req refers to the /-delimited values in the first argument (as I understand it) and res turns out to be the parameter supplied to the function that's sent.  That function ends up being "called" somehow and res is supplied as the argument (sort of - that argument is set by doing something like res.json(circles_select) )
    RED.httpAdmin.get('/location/:cmd/:id/:config_node_id/:circle_id/:selected_id', RED.auth.needsPermission('location.read'), function(req, res){
        var node = RED.nodes.getNode(req.params.id);
        var server = RED.nodes.getNode(req.params.config_node_id);
        if (req.params.cmd === "circles") {
            server.getCircles().then((circles) => {
                let circles_select = {};
                circles_select['selected'] = req.params.selected_id;
                //console.log("circles = " + JSON.stringify(circles));
                for (let circle of circles) {
                    circles_select[circle.id] = circle.name;
                }
                // Return a hash of all available circle IDs/names
                res.json(circles_select);
            }).catch((err) => console.log(err));
        } else if (req.params.cmd === "people") {
            server.getPeople(req.params.circle_id, function(people) {
                let person_select = {};
                person_select['selected'] = req.params.selected_id;
                //console.log("people = " + JSON.stringify(people));
                for (let person of people) {
                    person_select[person.id] = person.firstName + ' ' + person.lastName;
                }
                // Return a hash of all available people
                res.json(person_select);
            }).catch((err) => console.log(err));
        } else if (req.params.cmd === "places") {
            server.getPlaces(req.params.circle_id, function(places) {
                let place_select = {};
                place_select['selected'] = req.params.selected_id;
                //console.log("places = " + JSON.stringify(places));
                for (let place of places) {
                    place_select[place.id] = place.name;
                }
                // Return a hash of all available places
                res.json(place_select);
            }).catch((err) => console.log(err));
        }
    });

    RED.nodes.registerType("location", LocationNode, {});
};

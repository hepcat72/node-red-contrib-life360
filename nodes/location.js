function isSet(value) {
    return typeof value !== 'undefined' && value != null;
}

module.exports = function (RED) {
    class LocationNode {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            node.config = config;

            node.status({

            });

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

            node.on('close', function() {
                if (node.server) {
                    node.server.onLocationDisable(node.id);
                }
            });

            node.server.onChange(node.id, function (status_msg, numCheck, member, circleId, prevLocId, curLocId, numPrevLocBefore, numCurLocBefore) {
                node.sendMemeber(status_msg, numCheck, member, circleId, prevLocId, curLocId, numPrevLocBefore, numCurLocBefore);
            });
        }

        sendMemeber(status_msg, numCheck, member, circleId, prevLocId, curLocId, numPrevLocBefore, numCurLocBefore) {
            var node = this;

            if (!!member) {
                if(node.config.outputAtStartup || numCheck > 1) {

                    if(//Any circle and (any event or a specific event about a named location)
                       (node.config.circle === 'any' &&
                        (node.config.event === 'either' ||
                         (node.config.event === 'arrive' && isSet(curLocId)) ||
                         (node.config.event === 'leave' && isSet(prevLocId)))) ||

                       //A specific circle
                       (node.config.circle === circleId &&

                        (//Any event, any place, and (any or a specific person)
                         (node.config.event === 'either' && node.config.place === 'any' &&
                          (node.config.person === 'any' || node.config.person === member.id)) ||

                         (//Any event or arrival event
                          (node.config.event === 'either' || node.config.event === 'arrive') &&
                          //Arrival occurred at (any or a specific place)
                          isSet(curLocId)  && (node.config.place === 'any' || node.config.place === curLocId)  &&
                          //of any or a specific person
                          (node.config.person === 'any' || node.config.person === member.id)) ||

                         (//Any event or departure event
                          (node.config.event === 'either' || node.config.event === 'leave') &&
                          //Departure occurred at (any or a specific place)
                          isSet(prevLocId) && (node.config.place === 'any' || node.config.place === prevLocId) &&
                          //of any or a specific person
                          (node.config.person === 'any' || node.config.person === member.id)) ||

                         (//Arrival event occurred at a specific place
                          node.config.event === 'arrive' && isSet(curLocId)  && node.config.place === curLocId  &&
                          //of the first person
                          node.config.person === 'first' && numCurLocBefore === 0) ||

                         (//Departure event occurred at a specific place
                          node.config.event === 'leave'  && isSet(prevLocId) && node.config.place === prevLocId &&
                          //of the last person
                          node.config.person === 'last'  && numPrevLocBefore === 1)))) {

                        //outputs
                        node.send([{
                            payload: member
                        }]);

                        node.status({
                            fill: "green",
                            shape: "dot",
                            text: status_msg
                        });
                    }
                } else {
                    node.status({
                        fill: "yellow",
                        shape: "dot",
                        text: "Waiting for first event. (" + numCheck + ")"
                    });
                }
            } else {
                node.status({
                    fill: "yellow",
                    shape: "ring",
                    text: status_msg
                });
            }
        };
    }

    // Make all the available circle info accessible for the node's config screen
    RED.httpAdmin.get('/location/:cmd/:id/:config_node_id/:circle_id/:selected_id', RED.auth.needsPermission('location.read'), function(req, res){
        var node = RED.nodes.getNode(req.params.id);
        var server = RED.nodes.getNode(req.params.config_node_id);
        if (req.params.cmd === "circles") {
            server.getCircles().then((circles) => {
                let circles_select = {};
                circles_select['selected'] = req.params.selected_id;
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

# Life360

## Description

node-red-contrib-life360

[Life360](https://www.life360.com) is an iOS/Android app for location tracking and geofencing your own (and friends'/family) location.  It has a multitude of features, but this repo is explicitly for triggering home automations in [Node Red](http://nodered.org).  It mimmicks the triggers available in the [IFTTT Life360 service](http://ifttt.com/life360) by providing triggers for:

This package adds 2 nodes to Node Red:

- Server node (which contains login credentials and communicates with Life360)
- Location node (which contains the rules for specifying the types of events to output)

## Fork

This package is a fork of the package: node-red-contrib-life (version 0.1.4)

It fixes the following bugs:

- The output-at-startup checkbox (previously only applied to the first person in the first circle and now applies to all/circles & people).
- Spurious location-change events due to the processing of multiple circles is fixed.  Locations are now tracked by circle.

It adds the following filters for location change events:

- Selected (or any) circle
- Selected, any, first, or last person
- Selected or any place
- Event type selection: arrive, leave, or either

Examples of location change events to monitor:

- A specific person leaves or arrives at a specific (or any) place
- Any person (in a Life360 "circle") leaves or arrives at a specific (or any) place
- First person (in a Life360 "circle") arrives at a specific place
- Last person (in a Life360 "circle") leaves a specific place
- Any person in any circle leaves/arrives at a specific (or any) place

# Life360

## Description

node-red-contrib-life360

[Life360](https://www.life360.com) is an iOS/Android app for location tracking and geofencing your own (and friends'/family) location.  It has a multitude of features, but this repo is explicitly for triggering home automations in [Node Red](http://nodered.org).  It mimmicks the triggers available in the [IFTTT Life360 service](http://ifttt.com/life360) by providing triggers for:

- First to arrive
- Last to leave

This package adds 2 nodes to Node Red:

- Server node (which contains login credentials and communicates with Life360)
- Location node (which contains the rules for specifying the types of events to output)

## Fork

This package is a fork of the package: node-red-contrib-life (version 0.1.4)

It fixes the following bugs:

- The output-at-startup checkbox (previously only applied to the first person in the first circle and now applies to all/circles & people).
- Spurious location-change events due to the processing of multiple circles is fixed.  Locations are now tracked by circle.
- Clear the timer when node is destroyed or recreated. Fixes [#1](https://github.com/hepcat72/node-red-contrib-life360/issues/1), PR [#5](https://github.com/hepcat72/node-red-contrib-life360/pull/5).
- Correctly handle errors from life360. PR [#6](https://github.com/hepcat72/node-red-contrib-life360/pull/6).

It adds the following filters for location change events:

- Circle: Selected or any
- Person: Selected, any, first, or last
- Place: Selected or any
- Event type: Arrive, leave, or either

Examples of location change events to monitor:

- A specific person leaves or arrives at a specific (or any) place
- Any person (in a Life360 "circle") leaves or arrives at a specific (or any) place
- First person (in a Life360 "circle") arrives at a specific place
- Last person (in a Life360 "circle") leaves a specific place
- Any person in any circle leaves/arrives at a specific (or any) place

## Install

To install the latest stable npm-published release, use the palette manager in node-red.  To install the latest stable npm-published release from the command line:

    cd ~/.node-red
    npm i node-red-contrib-life360

To install the latest development version:

    cd ~/.node-red
    npm i https://github.com/hepcat72/node-red-contrib-life360

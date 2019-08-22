const EventEmitter = require('events');
const life360 = require('./index.js');

var session;
var updated_locations = {};

module.exports = class Life360Scanner extends EventEmitter {
  constructor(username, password) {
    super();
    var that = this;

    that.username = username;
    that.password = password;

    this.updateLife360();
    setInterval(function () {
      that.updateLife360();
    }, 15000);
  }

  updateSession(callback) {
    if (!session) {
      life360.authenticate(this.username, this.password).then(s => {
        session = s;
        callback(session);
      });
    } else {
      return callback(session);
    }
  }

  sendChanged(members) {
    let that = this;

    for (var i = 0; i < members.length; i++) {
      let member = members[i];
      let locationName = member.location.name;

      if (updated_locations[member.id]) {
        if (updated_locations[member.id] !== locationName) {
          updated_locations[member.id] = locationName;
          that.emit('newMember', member);
        }
      } else {
        updated_locations[member.id] = locationName;
        that.emit('newMember', member);
      }
    }
  }

  updateCircles(circles) {
    var that = this;
    for (var i = 0; i < circles.length; i++) {
      let circle = circles[i];
      let circleId = circle['id'];
      this.getCircle(circleId, function (circle) {
        var location = circle['members'][0]['location']['name'];
        // that.emit('newLocation', location);
        // that.emit('newCircle', circle);
        that.sendChanged(circle.members);
      });
    }
  }

  getCircle(circleId, callback) {
    var that = this;
    life360.circle(session, circleId).then(circle => {
      callback(circle);
    });
  }

  updateLife360() {
    var that = this;
    return this.updateSession(function (session) {
      life360.circles(session)
        .then(circles => {
          if (circles.length == 0) {
            throw new Error("No circles in your Life360.");
          }
          that.updateCircles(circles);
        })
    });
  }
}
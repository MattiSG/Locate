/*
---

script: Locate.js
version: 1.4
description: The Locate class is an easy-to-use MooTools interface over the W3C's Geolocation API.
license: MIT-style
authors:
- Christopher Beloch
- Matti Schneider-Ghibaudo

requires: 
  core/1.2.4: '*'

provides: [Locate]

...
*/

var Locate = new Class({
	/**Fired events:
	* - locate(position)
	* - error({code: Number, message: String})
	*		`code` is one of the [W3C's Geolocation API](http://dev.w3.org/geo/api/spec-source-v2.html#position_error_interface) or one of:
	*		- -1: browser does not support geolocation
	*		- -2: inner Locate configuration error
	*/
	Implements: [Options, Events],
	
	options: {
		loi: false, // loi = locate on init
		loiType: 'locate', // locate OR watch
		positionOptions: {
			enableHighAccuracy: true, // may result in slower response times or increased power consumption if true
			timeout: 10000, // expressed in milliseconds, can correspond in an error event on timeout
			maximumAge: 5000 // specified time in milliseconds
		}
	},

/*	//instance variables

	position: null,
	timeout: null, //some browsers do not implement the "timeout" option, so we have to handle it ourselves
*/
	
	initialize: function(options){
		this.setOptions(options);
				
		if (! navigator.geolocation) {
			this.fireEvent('error', {code: -1, message: "Your browser does not support geolocation."});
			return false;
		}

		if (this.options.loi) {
			switch (this.options.loiType) {
				case 'locate':
					this.locate();
					break;
				case 'watch':
					this.watcher();
					break;
				default:
					this.fireEvent('error', {code: -2, message: 'Configuration error (LOI)'});
			}
		}
	},
	
	setPosition: function(position){
		$clear(this.timeout);
		
		pos = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
			accuracy: position.coords.accuracy, // specified in meters
			altitude: position.coords.altitude, // null if not supported, meters above the WGS84 ellipsoid
			altitudeAccuracy: position.coords.altitudeAccuracy, // specified in meters
			heading: position.coords.heading, // null if not supported, specified in degrees counting clockwise to true nort
			speed: position.coords.speed // null if not supported, specified in meters per second
		};
		
		if(this.position)
			$extend(this.position, pos);
		else
			this.position = pos;
		
		$extend(this.position, {
			cardinalDirection: this.cardinalDirection()
		});
		
		this.fireEvent('locate', this.position);		
	},
	
	handleError: function(error){
		$clear(this.timeout);
		this.fireEvent('error', error);
	},
	
	locate: function(){
		$clear(this.timeout);
		this.timeout = this.fireEvent.delay(this.options.positionOptions.timeout, this, ['error', { code: 3, message: 'Timeout' }]);
		navigator.geolocation.getCurrentPosition(this.setPosition.bind(this), this.handleError.bind(this), this.options.positionOptions);
	},
	
	watcher: function(){
		// have to call it 'watcher'
		// 'watch' is causing errors on Firefox, MobileSafari works perfect
		this.watchId = navigator.geolocation.watchPosition(this.setPosition.bind(this), this.handleError.bind(this), this.options.positionOptions);
	},
	
	stopWatcher: function(){
		this.watchId = navigator.geolocation.clearWatch(this.watchId);		
	},
	
	cardinalDirection: function(){
		if(!this.position.heading) // if heading is null
			return null;
		if(this.position.heading >= 337.5 || (this.position.heading >= 0 && this.position.heading <= 22.5))
			return "N";
		if(this.position.heading >= 22.5 && this.position.heading <= 67.5)
			return "NE";
		if(this.position.heading >= 67.5 && this.position.heading <= 112.5)
			return "E";
		if(this.position.heading >= 112.5 && this.position.heading <= 157.5)
			return "SE";
		if(this.position.heading >= 157.5 && this.position.heading <= 202.5)
			return "S";
		if(this.position.heading >= 202.5 && this.position.heading <= 247.5)
			return "SW";
		if(this.position.heading >= 247.5 && this.position.heading <= 292.5)
			return "W";
		if(this.position.heading >= 292.5 && this.position.heading <= 337.5)
			return "NW";
	}
});

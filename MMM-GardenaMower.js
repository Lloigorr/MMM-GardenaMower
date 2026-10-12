Module.register("MMM-GardenaMower", {

	defaults: {
		updateInterval: 15 * 60 * 1000,
		showActivity: true,
		showBattery: true,
		showTime: true,
		showConnection: true,
		showError_as_Text: true
	},

	start() {
		this.mowerData = null;

		this.sendSocketNotification("CONFIG", this.config);
		this.sendSocketNotification("GET_MOWER");

		this.scheduleUpdate();
	},

	scheduleUpdate() {
		setInterval(() => {
			this.sendSocketNotification("GET_MOWER");
		}, this.config.updateInterval);
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "MOWER_DATA") {
			this.mowerData = payload;
			this.updateDom();
		}

		if (notification === "MOWER_ERROR") {
			console.error("Mäher Fehler:", payload);
		}
	},

	getErrorMessage(errorCode) {
		if (errorCode === null || errorCode === undefined) {
			return "Kein Fehler";
		}

		switch (errorCode) {
			case 0: return "Unerwarteter Fehler";
			case 1: return "Außerhalb des Arbeitsbereichs";
			case 2: return "Kein Schleifensignal";
			case 3: return "Falsches Schleifensignal";
			case 4: return "Problem mit dem Schleifensensor vorne";
			case 5: return "Problem mit dem Schleifensensor hinten";
			case 6: return "Problem mit dem Schleifensensor links";
			case 7: return "Problem mit dem Schleifensensor rechts";
			case 8: return "Falscher PIN-Code";
			case 9: return "Eingeklemmt";
			case 10: return "Umgekippt";
			case 11: return "Batterie schwach";
			case 12: return "Batterie leer";
			case 13: return "Kein Antrieb";
			case 14: return "Mäher angehoben";
			case 15: return "Angehoben";
			case 16: return "In Ladestation festgefahren";
			case 17: return "Ladestation blockiert";
			case 18: return "Problem mit Kollisionssensor hinten";
			case 19: return "Problem mit Kollisionssensor vorne";
			case 20: return "Radmotor blockiert rechts";
			case 21: return "Radmotor blockiert links";
			case 22: return "Problem mit Radantrieb rechts";
			case 23: return "Problem mit Radantrieb links";
			case 24: return "Schneidsystem blockiert";
			case 25: return "Schneidsystem blockiert";
			case 29: return "Hang zu steil";
			case 30: return "Problem mit dem Ladesystem";
			case 31: return "Problem mit STOP-Knopf";
			case 32: return "Problem mit Neigungssensor";
			case 33: return "Mäher geneigt";
			case 34: return "Schneiden gestoppt – Hang zu steil";
			case 35: return "Radmotor überlastet rechts";
			case 36: return "Radmotor überlastet links";
			case 38: return "Elektronisches Problem";
			case 39: return "Problem mit Schneidmotor";
			case 48: return "Keine Antwort vom Ladegerät";
			case 66: return "Batterieproblem";
			case 69: return "Alarm! Mäher wurde ausgeschaltet";
			case 70: return "Alarm! Mäher gestoppt";
			case 71: return "Alarm! Mäher angehoben";
			case 72: return "Alarm! Mäher geneigt";
			case 74: return "Alarm! Außerhalb des Geozauns";
			case 77: return "Kommunikationsmodul nicht verfügbar";
			case 90: return "Kein Strom in der Ladestation";
			default: return `Fehlercode ${errorCode}`;
		}
	},

	getActivityText(activity) {
		switch (activity) {
			case "OK_CUTTING":
				return "mäht";
			case "OK_SEARCHING":
				return "sucht Ladestation";
			case "OK_CHARGING":
				return "lädt";
			case "PARKED_TIMER":
				return "geparkt (Timer)";
			case "PARKED_PARK_SELECTED":
				return "geparkt";
			case "PARKED_AUTOTIMER":
				return "geparkt (AutoTimer)";
			case "PAUSED":
				return "pausiert";
			case "OFF_DISABLED":
				return "ausgeschaltet";
			case "OFF_HATCH_OPEN":
				return "Klappe offen";
			case "OK_LEAVING":
				return "verlässt Ladestation";
			default:
				return activity || "Unbekannt";
		}
	},

	getStateText(state) {
		switch (state) {
			case "OK":
				return "OK";
			case "WARNING":
				return "Warnung";
			case "ERROR":
				return "Fehler";
			default:
				return state || "Unbekannt";
		}
	},

	getDom() {
		const wrapper = document.createElement("div");

		if (!this.mowerData) {
			wrapper.innerHTML = "Lade Mäherdaten...";
			return wrapper;
		}

		const mower = this.mowerData;

		if (!mower.name) {
			wrapper.innerHTML = "Kein Mäher gefunden";
			return wrapper;
		}

		const name = mower.name;
		const activity = this.getActivityText(mower.activity);
		const state = this.getStateText(mower.state);
		const errorCode = mower.errorCode;
		const battery = mower.batteryPercent;
		const operatingHours = mower.operatingHours;
		const rfLinkState = mower.rfLinkState;
		const rfLinkLevel = mower.rfLinkLevel;

		let html = `${name}`;

		if (this.config.showActivity) {
			html += ` &nbsp;|&nbsp; ${activity}`;
		}

		if (this.config.showBattery && battery !== null && battery !== undefined) {
			html += ` &nbsp;|&nbsp; Akku: ${battery}%`;
		}

		if (this.config.showTime && operatingHours !== null && operatingHours !== undefined) {
			html += ` &nbsp;|&nbsp; Betriebsstunden: ${Number(operatingHours).toFixed(0)}h`;
		}

		if (this.config.showConnection && rfLinkState) {
			if (rfLinkLevel !== null && rfLinkLevel !== undefined) {
				html += ` &nbsp;|&nbsp; Funk: ${rfLinkState} (${rfLinkLevel}%)`;
			} else {
				html += ` &nbsp;|&nbsp; Funk: ${rfLinkState}`;
			}
		}

		html += ` &nbsp;|&nbsp; Status: ${state}`;

		if (errorCode !== null && errorCode !== undefined && errorCode !== 0) {
			if (this.config.showError_as_Text) {
				html += ` &nbsp;|&nbsp; Fehler: ${this.getErrorMessage(errorCode)}`;
			} else {
				html += ` &nbsp;|&nbsp; Fehlercode: ${errorCode}`;
			}
		}

		wrapper.innerHTML = html;
		return wrapper;
	}

});

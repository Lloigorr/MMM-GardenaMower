Module.register("MMM-GardenaMower", {

	defaults: {
		updateInterval: 15 * 60 * 1000,
		pauseApiFromHour: 22,
  		pauseApiToHour: 6,
		showActivity: true,
		showBattery: true,
		showTime: true,
		showConnection: true,
		showError_as_Text: true
	},

	start() {
		this.mowerData = null;
		this.lastUpdateTime = null;

		this.sendSocketNotification("CONFIG", this.config);
		this.sendSocketNotification("GET_MOWER");
		
		this.scheduleUpdate();

		setInterval(() => {
    		this.updateDom();
  		}, 15 * 1000);
	},
	
	scheduleUpdate() {
  		setInterval(() => {
    		this.sendSocketNotification("GET_MOWER");
  		}, this.config.updateInterval);
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "MOWER_DATA") {
			this.mowerData = payload;
			this.lastUpdateTime = new Date();
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
			case "OUTSIDE_WORKING_AREA": return "Außerhalb des Arbeitsbereichs";
			case "OFF_HATCH_CLOSED": return "Kein Schleifensignal";
			case 3: return "Falsches Schleifensignal";
			case 4: return "Problem mit dem Schleifensensor vorne";
			case 5: return "Problem mit dem Schleifensensor hinten";
			case 6: return "Problem mit dem Schleifensensor links";
			case 7: return "Problem mit dem Schleifensensor rechts";
			case 8: return "Falscher PIN-Code";
			case "TRAPPED": return "Eingeklemmt";
			case 10: return "Umgekippt";
			case 11: return "Batterie schwach";
			case "EMPTY_BATTERY": return "Batterie leer";
			case 13: return "Kein Antrieb";
			case "LIFTED": return "Mäher angehoben";
			case "WAIT_STOP_PRESSED": return "STOP-Taste gedrückt";
			case "PARKED_DAILY_LIMIT_REACHED": return "tägliches Limit erreicht";
			case "CHARGING_STATION_BLOCKED": return "Ladestation blockiert";
			case 18: return "Problem mit Kollisionssensor hinten";
			case 19: return "Problem mit Kollisionssensor vorne";
			case 20: return "Radmotor blockiert rechts";
			case 21: return "Radmotor blockiert links";
			case 22: return "Problem mit Radantrieb rechts";
			case 23: return "Problem mit Radantrieb links";
			case "CUTTING_SYSTEM_BLOCKED": return "Schneidsystem blockiert";
			case "OFF_HATCH_OPEN": return "STOP-Taste gedrückt";
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
			case "UPSIDE_DOWN": return "Mäher steht auf dem Kopf";
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
				return "lädt den Akku";
			case "PARKED_TIMER":
				return "ist geparkt (Zeitplan)";
			case "PARKED_PARK_SELECTED":
				return "ist geparkt";
			case "PARKED_AUTOTIMER":
				return " ist geparkt (AutoTimer)";
			case "PAUSED":
				return "macht Pause";
			case "OFF_DISABLED":
				return "ist ausgeschaltet";
			case "OFF_HATCH_OPEN":
				return "Klappe offen";
			case "OK_LEAVING":
				return "verlässt Ladestation";
			case "NONE":
				return "hat ein Problem";
			case "OK_CUTTING_TIMER_OVERRIDDEN":
				return "mäht (nicht nach Zeitplan)";
			default:
				return activity || "Unbekannt";
		}
	},

	getStateText(state) {
		switch (state) {
			case "OK":
				return 'Alles Okay <i class="fa-solid fa-face-smile"></i>';
			case "WARNING":
				return "Warnung:";
			case "ERROR":
				return "Fehler:";
			default:
				return state || "Unbekannt";
		}
	},

	getLastUpdateText() {
  		if (!this.lastUpdateTime) {
    		return "noch keine Aktualisierung";
  		}

  		const timeString = this.lastUpdateTime.toLocaleTimeString("de-DE", {
    		hour: "2-digit",
    		minute: "2-digit"
  		});

  		const diffMs = Date.now() - this.lastUpdateTime.getTime();
  		const diffMin = Math.floor(diffMs / 60000);

  		if (diffMin < 1) {
    		return `${timeString} (gerade eben)`;
  		}

  		if (diffMin === 1) {
    		return `${timeString} (vor 1 Minute)`;
  		}

  		if (diffMin < 60) {
    		return `${timeString} (vor ${diffMin} Minuten)`;
  		}

  		const hours = Math.floor(diffMin / 60);
  		const minutes = diffMin % 60;

  		return `${timeString} (vor ${hours}h ${minutes}m)`;
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

		let html = `<strong><i class="fas fa-solid fa-fan"></i> ${name}</strong>`;

		if (this.config.showActivity) {
			html += ` &nbsp;&nbsp; ${activity}<br>`;
		}

		if (this.config.showBattery && battery !== null && battery !== undefined) {
			html += ` &nbsp; <i class="fas fa-battery-half"></i> ${battery}%`;
		}

		if (this.config.showTime && operatingHours !== null && operatingHours !== undefined) {
			html += ` &nbsp; <i class="fa-solid fa-stopwatch"></i> ${Number(operatingHours).toFixed(0)}h<br>`;
		}

		if (this.config.showConnection && rfLinkState) {
			if (rfLinkLevel !== null && rfLinkLevel !== undefined) {
				html += ` &nbsp; <i class="fa-solid fa-wifi"></i> ${rfLinkState} (${rfLinkLevel}%)<br>`;
			} else {
				html += ` &nbsp; <i class="fa-solid fa-wifi"></i> ${rfLinkState}<br>`;
			}
		}

		html += ` &nbsp; ${state}`;

		if (errorCode) {
			if (this.config.showError_as_Text) {
				html += ` &nbsp; ${this.getErrorMessage(errorCode)}`;
			} else {
				html += ` &nbsp; Fehlercode: ${errorCode}`;
			}
		}

		const lastUpdateText = this.getLastUpdateText();
		html += `<br><span class="xsmall dimmed">Letzte Aktualisierung: ${lastUpdateText}</span>`;
		
		wrapper.innerHTML = html;
		return wrapper;
	}

});

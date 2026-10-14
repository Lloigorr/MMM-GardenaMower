const NodeHelper = require("node_helper");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({

	start() {
		this.accessToken = null;
		this.tokenExpires = 0;
		this.config = null;
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "CONFIG") {
			this.config = payload;
			return;
		}

		if (notification === "GET_MOWER") {
			this.getMowerStatus();
		}
	},

	async getAccessToken() {
		const params = new URLSearchParams();
		params.append("grant_type", "client_credentials");
		params.append("client_id", this.config.client_id);
		params.append("client_secret", this.config.client_secret);

		try {
			const response = await fetch(
				"https://api.authentication.husqvarnagroup.dev/v1/oauth2/token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					body: params
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Token Fehler ${response.status}: ${errorText}`);
			}

			const data = await response.json();

			this.accessToken = data.access_token;
			this.tokenExpires = Date.now() + (data.expires_in * 1000) - 60000;

			console.log("Gardena Token OK");
		} catch (error) {
			console.error("Token Fehler:", error);
			this.sendSocketNotification("MOWER_ERROR", {
				message: "Token konnte nicht geholt werden",
				details: error.message
			});
		}
	},

	async fetchGardena(url) {
		const response = await fetch(url, {
			headers: {
				"Authorization": `Bearer ${this.accessToken}`,
				"X-Api-Key": this.config.client_id
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Gardena API Fehler ${response.status}: ${errorText}`);
		}

		return response.json();
	},

	findIncludedByType(included, type) {
		if (!Array.isArray(included)) {
			return null;
		}

		return included.find(item => item.type === type) || null;
	},

	normalizeMowerData(locationResponse) {
		const included = locationResponse.included || [];

		const commonService = this.findIncludedByType(included, "COMMON");
		const mowerService = this.findIncludedByType(included, "MOWER");

		if (!commonService || !mowerService) {
			throw new Error("Kein MOWER- oder COMMON-Service in der Location gefunden");
		}

		const commonAttributes = commonService.attributes || {};
		const mowerAttributes = mowerService.attributes || {};

		return {
			name: commonAttributes.name?.value || "Unbekannter Mäher",
			batteryPercent: commonAttributes.batteryLevel?.value ?? null,
			batteryState: commonAttributes.batteryState?.value || null,
			rfLinkState: commonAttributes.rfLinkState?.value || null,
			rfLinkLevel: commonAttributes.rfLinkLevel?.value ?? null,
			serial: commonAttributes.serial?.value || null,
			modelType: commonAttributes.modelType?.value || null,

			state: mowerAttributes.state?.value || null,
			activity: mowerAttributes.activity?.value || null,
			operatingHours: mowerAttributes.operatingHours?.value ?? null,
			errorCode: mowerAttributes.lastErrorCode?.value ?? null
		};
	},

	async getMowerStatus() {
		if (!this.config) {
			return;
		}
		
		if (!this.accessToken || Date.now() > this.tokenExpires) {
			await this.getAccessToken();

			if (!this.accessToken) {
      			return;
			}	
		}

		try {
			const locationsResponse = await this.fetchGardena("https://api.smart.gardena.dev/v1/locations");
			const locations = locationsResponse.data || [];

			if (!Array.isArray(locations) || locations.length === 0) {
				throw new Error("Keine Gardena-Location gefunden");
			}

			let normalizedMower = null;

			for (const location of locations) {
				const locationId = location.id;
				const locationResponse = await this.fetchGardena(`https://api.smart.gardena.dev/v1/locations/${locationId}`);

				const included = locationResponse.included || [];
				const hasMower = included.some(item => item.type === "MOWER");
				const hasCommon = included.some(item => item.type === "COMMON");

				if (hasMower && hasCommon) {
					normalizedMower = this.normalizeMowerData(locationResponse);
					normalizedMower.locationId = locationId;
					normalizedMower.locationName = locationResponse.data?.attributes?.name || null;
					break;
				}
			}

			if (!normalizedMower) {
				throw new Error("Kein kompatibler Gardena-Mäher gefunden");
			}

			this.sendSocketNotification("MOWER_DATA", normalizedMower);

		} catch (error) {
			console.error("Mäher Fehler:", error);

			this.sendSocketNotification("MOWER_ERROR", {
				message: "Gardena-Mäherdaten konnten nicht geladen werden",
				details: error.message
			});
		}
	}

});

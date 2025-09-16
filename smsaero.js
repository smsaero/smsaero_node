const axios = require("axios");

class SmsAero {
	constructor(
		email,
		apiKey,
		signature = "Sms Aero",
		gateURLs = [
			"@gate.smsaero.ru/v2/",
			"@gate.smsaero.org/v2/",
			"@gate.smsaero.net/v2/",
			"@gate.smsaero.uz/v2/",
		],
		typeSend = 2
	) {
		this.email = email;
		this.apiKey = apiKey;
		this.gateURLs = gateURLs.map(
			(url) => `${encodeURIComponent(email)}:${apiKey}${url}`
		);
		this.proto = "https";
		this.currentURLIndex = 0; // Start with the first URL
		this.signature = signature;
		this.typeSend = typeSend;
		this.session = axios.create();
	}

	get currentURLGate() {
		return this.gateURLs[this.currentURLIndex];
	}

	async _request(selector, data = {}, page = null) {
		const urlBase = `${this.proto}://${this.currentURLGate}`;

		let retryWithHTTP = false;

		const url = new URL(selector, urlBase);
		if (page) {
			url.searchParams.set("page", page);
		}

		for (let i = 0; i < this.gateURLs.length; i++) {
			try {
				const response = await this.session.post(url.toString(), data, {
					auth: {
						username: this.email,
						password: this.apiKey,
					},
				});
				this.currentURLIndex = 0; // Reset to the primary URL after a successful request
				return this._checkResponse(response.data);
			} catch (err) {
				if (err.code === "EPROTO") {
					// SSL related error
					this.proto = "http";
					retryWithHTTP = true;
					i--; // Decrement the index to retry with the same URL gate but with http protocol
					continue;
				}
				// If it's the last URL or the error isn't related to connectivity, throw the error
				if (
					i === this.gateURLs.length - 1 ||
					(err.response &&
						err.response.status < 500 &&
						err.response.status !== 429)
				) {
					console.log(err.response);
					throw new SmsAeroHTTPError(err);
				}

				if (!retryWithHTTP) {
					this.currentURLIndex =
						(this.currentURLIndex + 1) % this.gateURLs.length;
				} else {
					retryWithHTTP = false; // Reset the flag for the next iteration
				}
			}
		}
	}

	static _getNumber(number) {
		if (Array.isArray(number)) {
			return ["numbers", number];
		} else {
			return ["number", String(number)];
		}
	}

	_checkResponse(response) {
		if ("result" in response) {
			if (response.result === "reject") {
				throw new SmsAeroError(response.reason);
			} else if (response.result === "no credits") {
				throw new SmsAeroError(response.result);
			}
		}
		return response;
	}

	async send(number, text, dateSend = null, callbackUrl = null) {
		const [num, phoneNumber] = SmsAero._getNumber(number);
		const data = {
			[num]: phoneNumber,
			sign: this.signature,
			text: text,
			callbackUrl: callbackUrl,
		};
		if (dateSend !== null) {
			if (dateSend instanceof Date) {
				data.dateSend = Math.floor(dateSend.getTime() / 1000);
			} else {
				throw new SmsAeroError("param `date` is not a Date object");
			}
		}
		return this._request("sms/send", data);
	}

	smsStatus(smsId) {
		return this._request("sms/status", {id: smsId});
	}

	smsList(number = null, text = null, page = null) {
		const data = {};
		if (number !== null) {
			data.number = String(number);
		}
		if (text !== null) {
			data.text = text;
		}
		return this._request("sms/list", data, page);
	}

	balance() {
		return this._request("balance");
	}

	auth() {
		return this._request("auth");
	}

	cards() {
		return this._request("cards");
	}

	addBalance(sum, cardId) {
		return this._request("balance/add", {sum: sum, cardId: cardId});
	}

	tariffs() {
		return this._request("tariffs");
	}

	signAdd(name) {
		return this._request("sign/add", {name: name});
	}

	signList(page = null) {
		return this._request("sign/list", null, page);
	}

	groupAdd(name) {
		return this._request("group/add", {name: name});
	}

	groupDelete(groupId) {
		return this._request("group/delete", {id: groupId});
	}

	groupList(page = null) {
		return this._request("group/list", null, page);
	}

	contactAdd(
		number,
		groupId = null,
		birthday = null,
		sex = null,
		lname = null,
		fname = null,
		sname = null,
		param1 = null,
		param2 = null,
		param3 = null
	) {
		return this._request("contact/add", {
			number: String(number),
			groupId: groupId,
			birthday: birthday,
			sex: sex,
			lname: lname,
			fname: fname,
			sname: sname,
			param1: param1,
			param2: param2,
			param3: param3,
		});
	}

	contactDelete(contactId) {
		return this._request("contact/delete", {id: contactId});
	}

	contactList(
		number = null,
		groupId = null,
		birthday = null,
		sex = null,
		operator = null,
		lname = null,
		fname = null,
		sname = null,
		page = null
	) {
		return this._request(
			"contact/list",
			{
				number: number !== null ? String(number) : null,
				groupId: groupId,
				birthday: birthday,
				sex: sex,
				operator: operator,
				lname: lname,
				fname: fname,
				sname: sname,
			},
			page
		);
	}

	blacklistAdd(number) {
		const [num, phoneNumber] = SmsAero._getNumber(number);
		return this._request("blacklist/add", {[num]: phoneNumber});
	}

	blacklistList(number = null, page = null) {
		const data = number !== null ? {number: String(number)} : null;
		return this._request("blacklist/list", data, page);
	}

	blacklistDelete(blacklistId) {
		return this._request("blacklist/delete", {id: Number(blacklistId)});
	}

	hlrCheck(number) {
		const [num, phoneNumber] = SmsAero._getNumber(number);
		return this._request("hlr/check", {[num]: phoneNumber});
	}

	hlrStatus(hlrId) {
		return this._request("hlr/status", {id: Number(hlrId)});
	}

	numberOperator(number) {
		const [num, phoneNumber] = SmsAero._getNumber(number);
		return this._request("number/operator", {[num]: phoneNumber});
	}

	viberSend(
		sign,
		channel,
		text,
		number = null,
		groupId = null,
		imageSource = null,
		textButton = null,
		linkButton = null,
		dateSend = null,
		signSms = null,
		channelSms = null,
		textSms = null,
		priceSms = null
	) {
		const [num, phoneNumber] = SmsAero._getNumber(number);
		return this._request("viber/send", {
			[num]: phoneNumber,
			groupId: groupId !== null ? Number(groupId) : null,
			sign: sign !== null ? String(sign) : null,
			channel: channel !== null ? String(channel) : null,
			text: text,
			imageSource: imageSource,
			textButton: textButton,
			linkButton: linkButton,
			dateSend: dateSend,
			signSms: signSms,
			channelSms: channelSms,
			textSms: textSms,
			priceSms: priceSms,
		});
	}

	viberSignList() {
		return this._request("viber/sign/list");
	}

	viberList(page = null) {
		return this._request("viber/list", null, page);
	}

	flashcallSend(number, code) {
		return this._request("flashcall/send", {
			phone: number,
			code: Number(code),
		});
	}

	flashcallList(number = null, text = null, page = null) {
		const data = {};
		if (number !== null) {
			data.number = String(number);
		}
		if (text !== null) {
			data.text = text;
		}
		return this._request("flashcall/list", data, page);
	}

	flashcallStatus(pk) {
		return this._request("flashcall/status", {id: pk});
	}

	async sendTelegram(number, code, sign = null, text = null) {
		const [num, phoneNumber] = SmsAero._getNumber(number);
		const data = {
			[num]: phoneNumber,
			code: Number(code),
		};
		if (sign !== null) {
			data.sign = sign;
		}
		if (text !== null) {
			data.text = text;
		}
		return this._request("telegram/send", data);
	}

	telegramStatus(telegramId) {
		return this._request("telegram/status", {id: Number(telegramId)});
	}
}

class SmsAeroError extends Error {
	constructor(message) {
		super(message);
		this.name = "SmsAeroError";
	}
}

class SmsAeroHTTPError extends SmsAeroError {
	constructor(message) {
		super(message);
		this.name = "SmsAeroHTTPError";
	}
}

module.exports = {
	SmsAero: SmsAero,
	SmsAeroError: SmsAeroError,
	SmsAeroHTTPError: SmsAeroHTTPError,
};

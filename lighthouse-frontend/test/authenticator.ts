// A software passkey for tests: it produces the same registration and sign-in
// responses a browser would hand to the API.
import { createHash, webcrypto as crypto } from "node:crypto";

const text = (value: string) => new TextEncoder().encode(value);
const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const sha256 = (data: Uint8Array) => new Uint8Array(createHash("sha256").update(data).digest());
const concat = (...parts: Uint8Array[]) => Uint8Array.from(parts.flatMap((part) => [...part]));

// Minimal CBOR: integers, byte strings, text strings and maps.
const head = (major: number, n: number) =>
	n < 24 ? [major << 5 | n] : n < 256 ? [major << 5 | 24, n] : [major << 5 | 25, n >> 8, n & 255];
const cbor = (value: unknown): Uint8Array => {
	if (typeof value === "number") return Uint8Array.from(value >= 0 ? head(0, value) : head(1, -1 - value));
	if (typeof value === "string") return concat(Uint8Array.from(head(3, text(value).length)), text(value));
	if (value instanceof Uint8Array) return concat(Uint8Array.from(head(2, value.length)), value);
	if (value instanceof Map) {
		return concat(Uint8Array.from(head(5, value.size)), ...[...value].flatMap(([k, v]) => [cbor(k), cbor(v)]));
	}
	throw new Error("unsupported CBOR value");
};

// WebCrypto signs as raw r||s; WebAuthn expects DER.
const toDER = (raw: Uint8Array) => {
	const integer = (bytes: Uint8Array) => {
		let start = 0;
		while (start < bytes.length - 1 && bytes[start] === 0) start += 1;
		let value = bytes.slice(start);
		if (value[0]! & 0x80) value = concat(Uint8Array.of(0), value);
		return concat(Uint8Array.of(2, value.length), value);
	};
	const r = integer(raw.slice(0, 32));
	const s = integer(raw.slice(32));
	return concat(Uint8Array.of(0x30, r.length + s.length), r, s);
};

const USER_PRESENT_AND_VERIFIED = 0x05;
const ATTESTED_CREDENTIAL = 0x40;

export interface PasskeyOptions {
	rpID: string;
	origin: string;
}

export class TestPasskey {
	readonly id = crypto.getRandomValues(new Uint8Array(32));
	#keys!: crypto.CryptoKeyPair;
	#userHandle = "";
	#counter = 0;
	readonly #site: PasskeyOptions;

	constructor(site: PasskeyOptions) {
		this.#site = site;
	}

	#authenticatorData(flags: number, attested = new Uint8Array()) {
		const counter = new Uint8Array(4);
		new DataView(counter.buffer).setUint32(0, this.#counter);
		return concat(sha256(text(this.#site.rpID)), Uint8Array.of(flags), counter, attested);
	}

	#clientData(type: string, challenge: string) {
		return text(JSON.stringify({ type, challenge, origin: this.#site.origin, crossOrigin: false }));
	}

	async register(options: { challenge: string; user: { id: string } }) {
		this.#keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
		this.#userHandle = options.user.id;
		const jwk = await crypto.subtle.exportKey("jwk", this.#keys.publicKey);
		const coordinate = (value?: string) => new Uint8Array(Buffer.from(value!, "base64url"));
		const publicKey = cbor(new Map<number, unknown>([[1, 2], [3, -7], [-1, 1], [-2, coordinate(jwk.x)], [-3, coordinate(jwk.y)]]));
		const attested = concat(new Uint8Array(16), Uint8Array.of(0, this.id.length), this.id, publicKey);
		const attestationObject = cbor(new Map<string, unknown>([
			["fmt", "none"],
			["attStmt", new Map()],
			["authData", this.#authenticatorData(USER_PRESENT_AND_VERIFIED | ATTESTED_CREDENTIAL, attested)],
		]));
		return {
			id: b64(this.id),
			rawId: b64(this.id),
			type: "public-key",
			clientExtensionResults: {},
			response: {
				clientDataJSON: b64(this.#clientData("webauthn.create", options.challenge)),
				attestationObject: b64(attestationObject),
				transports: ["internal"],
			},
		};
	}

	async signIn(options: { challenge: string }) {
		this.#counter += 1;
		const clientData = this.#clientData("webauthn.get", options.challenge);
		const authenticatorData = this.#authenticatorData(USER_PRESENT_AND_VERIFIED);
		const signature = await crypto.subtle.sign(
			{ name: "ECDSA", hash: "SHA-256" },
			this.#keys.privateKey,
			concat(authenticatorData, sha256(clientData)),
		);
		return {
			id: b64(this.id),
			rawId: b64(this.id),
			type: "public-key",
			clientExtensionResults: {},
			response: {
				clientDataJSON: b64(clientData),
				authenticatorData: b64(authenticatorData),
				signature: b64(toDER(new Uint8Array(signature))),
				userHandle: this.#userHandle,
			},
		};
	}
}

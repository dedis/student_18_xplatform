const Buffer = require("buffer/").Buffer;
const Helper = require("./Helper");
const ObjectType = require("./ObjectType");
const Crypto = require("./Crypto");
const TomlParser = require("toml");
const Tomlify = require('tomlify-j0.4');
const UUID = require("pure-uuid");
const CothorityMessages = require("./protobuf/build/cothority-messages");

const HEX_KEYWORD = "hex";
const BASE64_KEYWORD = "base64";

const URL_PORT_SPLITTER = ":";
const BASE_URL_WS = "ws://";
const BASE_URL_TCP = "tcp://";

const BASE_URL_CONODE_ID = "https://dedis.epfl.ch/id/";
const NAME_SPACE_URL = "ns:URL";
const UUID_VERSION = 5;

/**
 * Converts a byte array to it's hexadecimal string representation
 * @param {Uint8Array} byteArray - the byte array to convert
 * @returns {string} - the hexadecimal string
 */
function byteArrayToHex(byteArray) {
  if (!(byteArray instanceof Uint8Array)) {
    throw new Error("byteArray must be an instance of Uint8Array");
  }

  return Buffer.from(byteArray).toString(HEX_KEYWORD);
}

/**
 * Converts a hexadecimal string to it's byte array representation.
 * @param {string} hexString - the hexadecimal string to convert
 * @returns {Uint8Array} - the byte array
 */
function hexToByteArray(hexString) {
  if (typeof hexString !== "string") {
    throw new Error("hexString must be of type string");
  }

  const hexBuffer = Buffer.from(hexString, HEX_KEYWORD);

  return new Uint8Array(hexBuffer.buffer, hexBuffer.byteOffset, hexBuffer.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}

/**
 * Converts a byte array to it's base64 string representation.
 * @param {Uint8Array} byteArray - the byte array to convert
 * @returns {string} - the base64 string
 */
function byteArrayToBase64(byteArray) {
  if (!(byteArray instanceof Uint8Array)) {
    throw new Error("byteArray must be an instance of Uint8Array");
  }

  const hexString = byteArrayToHex(byteArray);

  return hexToBase64(hexString);
}

/**
 * Converts a base64 string to it's byte array representation.
 * @param {string} base64String - the base64 string to convert
 * @returns {Uint8Array} - the byte array
 */
function base64ToByteArray(base64String) {
  if (typeof base64String !== "string") {
    throw new Error("base64String must be of type string");
  }

  const hexString = base64ToHex(base64String);

  return hexToByteArray(hexString);
}

/**
 * Converts a hexadecimal string into it's base64 string representation.
 * @param {string} hexString - the hexadecimal string to convert
 * @returns {string} - the base64 string
 */
function hexToBase64(hexString) {
  if (typeof hexString !== "string") {
    throw new Error("hexString must be of type string");
  }

  return Buffer.from(hexString, HEX_KEYWORD).toString(BASE64_KEYWORD);
}

/**
 * Converts a base64 string into it's hexadecimal string representation.
 * @param {string} base64String - the base64 string to convert
 * @returns {string} - the hexadecimal string
 */
function base64ToHex(base64String) {
  if (typeof base64String !== "string") {
    throw new Error("base64String must be of type string");
  }

  return Buffer.from(base64String, BASE64_KEYWORD).toString(HEX_KEYWORD);
}

/**
 * Converts an object into its JSON string representation.
 * @param {object} object - the object taht will be converted to a JSON string
 * @returns {string} - the JSON string representation
 */
function objectToJson(object) {
  if (!(object !== undefined && typeof object === "object" && !Helper.isArray(object))) {
    throw new Error("object must be of type object (not array!) and not undefined");
  }

  return JSON.stringify(object, undefined, 4);
}

/**
 * Converts a JSON string into a JavaScript object.
 * @param {string} jsonString - the JSON string to convert to an object
 * @returns {object} - the object created from the JSON string
 */
function jsonToObject(jsonString) {
  if (typeof jsonString !== "string") {
    throw new Error("jsonString must be of type string");
  }

  return JSON.parse(jsonString);
}

/**
 * Converts an object into its TOML string representation.
 * @param {object} object - the object to be converted into TOML representation
 * @returns {string} - the TOML string representing the object
 */
function objectToToml(object) {
  if (!(object !== undefined && typeof object === "object" && !Helper.isArray(object))) {
    throw new Error("object must be of type object (not array!) and not undefined");
  }

  return Tomlify.toToml(object, { space: 4 });
}

/**
 * Converts a TOML string into a JavaScript object.
 * @param {string} tomlString - the TOML string to be converted into an object
 * @returns {object} - the object parsed from the TOML string
 */
function tomlToObject(tomlString) {
  if (typeof tomlString !== "string") {
    throw new Error("tomlString must be of type string");
  }

  return TomlParser.parse(tomlString);
}

/**
 * Converts a JSON string into it's TOML string representation.
 * @param {string} jsonString - the JSON string to be converted into a TOML string
 * @returns {string} - the TOML string converted from the JSON string
 */
function jsonToToml(jsonString) {
  if (typeof jsonString !== "string") {
    throw new Error("jsonString must be of type string");
  }

  const object = jsonToObject(jsonString);

  return objectToToml(object);
}

/**
 * Converts a TOML string into it's JSON string representation.
 * @param {string} tomlString - the TOML string to be converted into a JSON string
 * @returns {string} - the JSON string converted from the TOML string
 */
function tomlToJson(tomlString) {
  if (typeof tomlString !== "string") {
    throw new Error("tomlString must be of type string");
  }

  const object = tomlToObject(tomlString);

  return objectToJson(object);
}

/**
 * Converts a TCP URL to a Wesocket URL and builds a complete URL with the path given as parameter.
 * @param {ServerIdentity} serverIdentity - the server identity to take the url from
 * @param {string} path - the path after the base url
 * @returns {string} - the builded websocket url
 */
function tcpToWebsocket(serverIdentity, path) {
  if (!Helper.isOfType(serverIdentity, ObjectType.SERVER_IDENTITY)) {
    throw new Error("serverIdentity must be of type ServerIdentity");
  }
  if (typeof path !== "string") {
    throw new Error("path must be of type string");
  }

  let [ip, port] = serverIdentity.address.replace(BASE_URL_TCP, "").split(URL_PORT_SPLITTER);
  port = parseInt(port) + 1;

  return BASE_URL_WS + ip + URL_PORT_SPLITTER + port + path;
}

/**
 * Parses a JSON string into a Roster object, if the ServerIdentities does not have an ID yet it will be computed.
 * @param {string} jsonString - the JSON string to parse into a Roster object
 * @returns {Roster} - the parsed Roster object
 */
function parseJsonRoster(jsonString) {
  if (typeof jsonString !== "string") {
    throw new Error("jsonString must be of type string");
  }

  const roster = jsonToObject(jsonString);
  if (roster.list === undefined || !Array.isArray(roster.list)) {
    throw new Error("roster.list is undefined or not an array");
  }

  let rosterId = roster.id;
  if (rosterId !== undefined) {
    rosterId = base64ToByteArray(rosterId);
  }

  let aggregate = (roster.aggregate === undefined) ? undefined : base64ToByteArray(roster.aggregate);

  const points = [];
  const list = roster.list.map((server) => {
    if (aggregate === undefined) {
      points.push(Crypto.unmarshal(base64ToByteArray(server.public)));
    }

    let serverId = server.id;
    if (serverId !== undefined) {
      serverId = base64ToByteArray(serverId);
    }

    return toServerIdentity(server.address, base64ToByteArray(server.public), server.description, serverId);
  });

  if (aggregate === undefined) {
    aggregate = Crypto.aggregatePublicKeys(points);
  }

  return CothorityMessages.createRoster(rosterId, list, aggregate);
}

/**
 * Parses a TOML string into a Roster object, if the ServerIdentities does not have an ID yet it will be computed.
 *
 * The TOML has to be in this format:
  "[[servers]]\n" +
  "  Address = \"tcp://10.0.2.2:7002\"\n" +
  "  Public = \"HkDzpR5Imd7WNx8kl2lJcIVRVn8gfDByJnmlfrYh/zU=\"\n" +
  "  Description = \"Conode_1\"\n" +
  "[[servers]]\n" +
  "  Address = \"tcp://10.0.2.2:7004\"\n" +
  "  Public = \"Fx6zzvJM6VzxfByLY2+uArGPtd2lHKPVmoXGMhdaFCA=\"\n" +
  "  Description = \"Conode_2\"\n" +
  "[[servers]]\n" +
  "  Address = \"tcp://10.0.2.2:7006\"\n" +
  "  Public = \"j53MMKZNdtLlglcK9Ct1YYtkbbEOfq3R8ZoJOFIu6tE=\"\n" +
  "  Description = \"Conode_3\""
 *
 * @param {string} tomlString - the TOML string to parse into a Roster object
 * @returns {Roster} - the parsed Roster object
 */
function parseTomlRoster(tomlString) {
  if (typeof tomlString !== "string") {
    throw new Error("tomlString must be of type string");
  }

  const roster = tomlToObject(tomlString);
  if (roster.servers === undefined) {
    throw new Error("roster.servers is undefined");
  }

  roster.servers.forEach(server => {
    Object.getOwnPropertyNames(server).forEach((propertyName, index, array) => {
      const lowerCased = propertyName.toLocaleLowerCase();

      if (lowerCased !== propertyName) {
        server[lowerCased] = server[propertyName];
        delete server[propertyName];
      }
    });
  });

  roster.list = [];
  roster.servers.forEach(server => {
    roster.list.push(Helper.deepCopy(server));
  });
  delete roster.servers;

  return parseJsonRoster(JSON.stringify(roster));
}

/**
 * Parses a JSON string into a KeyPair object.
 * @param {string} jsonString - the JSON string to parse into a KeyPair object
 * @returns {KeyPair} - the parsed KeyPair object
 */
function parseJsonKeyPair(jsonString) {
  if (typeof jsonString !== "string") {
    throw new Error("jsonString must be of type string");
  }

  const keyPair = jsonToObject(jsonString);

  let publicComplete = undefined;
  if (keyPair.publicComplete !== undefined) {
    publicComplete = base64ToByteArray(keyPair.publicComplete);
  }

  return CothorityMessages.createKeyPair(base64ToByteArray(keyPair.public), base64ToByteArray(keyPair.private), publicComplete);
}

/**
 * Converts the arguments given as parameter into a ServerIdentity object.
 * @param {string} address - the address of the server
 * @param {Uint8Array} publicKey - the public key of the server
 * @param {string} description - the description of the server
 * @param {Uint8Array} id - the id of the server or undefined to be skipped
 * @returns {ServerIdentity} - the server identity object created from the given parameters
 */
function toServerIdentity(address, publicKey, description, id) {
  if (typeof address !== "string" || !Helper.isValidAddress(address)) {
    throw new Error("address must be of type string and have the right format");
  }
  if (!(publicKey instanceof Uint8Array) || !Helper.isValidPublicKey(publicKey)) {
    throw new Error("publicKey must be an instance of Uint8Array and have the right format");
  }
  if (typeof description !== "string") {
    throw new Error("description must be of type string");
  }
  if (!(id === undefined || id instanceof Uint8Array)) {
    throw new Error("id must be an instance of Uint8Array or be undefined to be skipped");
  }

  if (id === undefined) {
    id = publicKeyToUuid(publicKey);
  }

  return CothorityMessages.createServerIdentity(publicKey, id, address, description);
}

/**
 * Converts a public key into a UUID. This UUID can then be used to uniquely identify the conode.
 * @param {Uint8Array} publicKey - the public key of the server
 * @returns {Uint8Array} - the uuid of the server
 */
function publicKeyToUuid(publicKey) {
  if (!(publicKey instanceof Uint8Array)) {
    throw new Error("publicKey must be an instance of Uint8Array");
  }

  const url = BASE_URL_CONODE_ID + byteArrayToHex(publicKey);

  return new Uint8Array(new UUID(UUID_VERSION, NAME_SPACE_URL, url).export());
}

module.exports.byteArrayToHex = byteArrayToHex;
module.exports.hexToByteArray = hexToByteArray;
module.exports.byteArrayToBase64 = byteArrayToBase64;
module.exports.base64ToByteArray = base64ToByteArray;
module.exports.hexToBase64 = hexToBase64;
module.exports.base64ToHex = base64ToHex;
module.exports.objectToJson = objectToJson;
module.exports.jsonToObject = jsonToObject;
module.exports.objectToToml = objectToToml;
module.exports.tomlToObject = tomlToObject;
module.exports.jsonToToml = jsonToToml;
module.exports.tomlToJson = tomlToJson;
module.exports.tcpToWebsocket = tcpToWebsocket;
module.exports.parseJsonRoster = parseJsonRoster;
module.exports.parseTomlRoster = parseTomlRoster;
module.exports.parseJsonKeyPair = parseJsonKeyPair;
module.exports.toServerIdentity = toServerIdentity;
module.exports.publicKeyToUuid = publicKeyToUuid;

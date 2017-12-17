const ObservableModule = require("data/observable");
const ObservableArray = require("data/observable-array").ObservableArray;
const Package = require("../../Package");
const ObjectType = require("../../ObjectType");
const FilesPath = require("../../../../res/files/files-path");
const FileIO = require("../../../../lib/file-io/file-io");
const CothorityMessages = require("../../protobuf/build/cothority-messages");

/**
 * This singleton is the PoP component of the app. It contains everything related to PoP in general and used by both, the organizer and the attendee.
 */

/**
 * We define the PoP class which is the object representing the PoP component of the app.
 */

const EMPTY_ROSTER = CothorityMessages.createRoster(new Uint8Array(), [], new Uint8Array());
const EMPTY_POP_DESC = CothorityMessages.createPopDesc("", "", "", EMPTY_ROSTER);
const EMPTY_FINAL_STATEMENT = CothorityMessages.createFinalStatement(EMPTY_POP_DESC, [], new Uint8Array(), false);
const EMPTY_POP_TOKEN = CothorityMessages.createPopToken(EMPTY_FINAL_STATEMENT, new Uint8Array(), new Uint8Array());

class PoP {

  /**
   * Constructor for the PoP class.
   */
  constructor() {
    this._isLoaded = false;
    this._finalStatements = ObservableModule.fromObject({
      array: new ObservableArray()
    });
    this._popToken = ObservableModule.fromObject({
      array: new ObservableArray()
    });
  }

  /**
   * Getters and Setters.
   */

  /**
  * Gets the isLoaded property of PoP. It is only true once all the settings have been loaded into memory.
  * @returns {boolean} - a boolean that is true if PoP has completely been loaded into memory
  */
  isLoaded() {
    return this._isLoaded;
  }

  /**
   * Gets the final statements array.
   * @returns {ObservableArray} - an observable array containing all the final statements
   */
  getFinalStatements() {
    return this._finalStatements.array;
  }

  /**
   * Gets the final statements module.
   * @returns {ObservableModule} - an observable module/object containing everything related to the final statements (including the array of final statements)
   */
  getFinalStatementsModule() {
    return this._finalStatements;
  }

  /**
   * Gets the PoP-Token array.
   * @returns {ObservableArray} - an observable array containing all the PoP-Token
   */
  getPopToken() {
    return this._popToken.array;
  }

  /**
   * Gets the PoP-Token module.
   * @returns {ObservableModule} - an observable module/object containing everything related to the PoP-Token (including the array of PoP-Token)
   */
  getPopTokenModule() {
    return this._popToken;
  }

  /**
   * Sets the new final statements array given as parameter.
   * @param {Array} array - the new final statements to set
   * @param {boolean} save - if the new final statements array should be saved permanently
   * @returns {Promise} - a promise that gets resolved once the new final statements array has been set and saved if the save parameter is set to true
   */
  setFinalStatementsArray(array, save) {
    if (!(array instanceof Array)) {
      throw new Error("array must be an instance of Array");
    }
    if (!Helper.isOfType(array[0], ObjectType.FINAL_STATEMENT)) {
      throw new Error("array[i] must be an instance of FinalStatement");
    }
    if (typeof save !== "boolean") {
      throw new Error("save must be of type boolean");
    }

    // TODO
  }

  /**
   * Sets the new PoP-Token array given as parameter.
   * @param {Array} array - the new PoP-Token array to set
   * @param {boolean} save - if the new PoP-Token array should be saved permanently
   * @returns {Promise} - a promise that gets resolved once the new PoP-Token array has been set and saved if the save parameter is set to true
   */
  setPopTokenArray(array, save) {
    if (!(array instanceof Array)) {
      throw new Error("array must be an instance of Array");
    }
    if (!Helper.isOfType(array[0], ObjectType.POP_TOKEN)) {
      throw new Error("array[i] must be an instance of PopToken");
    }
    if (typeof save !== "boolean") {
      throw new Error("save must be of type boolean");
    }

    // TODO
  }

  /**
   * Action functions.
   */

  /**
  * Empties the final statements array (this action is not saved permanently).
  */
  emptyFinalStatementArray() {
    while (this._finalStatements.array.length > 0) {
      this._finalStatements.array.pop();
    }
  }

  /**
  * Empties the PoP-Token array (this action is not saved permanently).
  */
  emptyPopTokenArray() {
    while (this._popToken.array.length > 0) {
      this._popToken.array.pop();
    }
  }

  /**
  * Adds the new final statement given as parameter to the list of final statements.
  * @param {FinalStatement} finalStatement - the new final statement to add
  * @param {boolean} save - if the new final statement should be saved permanently
  * @returns {Promise} - a promise that gets resolved once the new final statement has been added and saved if the save parameter is set to true
  */
  addFinalStatement(finalStatement, save) {
    if (!Helper.isOfType(finalStatement, ObjectType.FINAL_STATEMENT)) {
      throw new Error("finalStatement must be an instance of FinalStatement");
    }
    if (typeof save !== "boolean") {
      throw new Error("save must be of type boolean");
    }

    const oldFinalStatements = this.getFinalStatements().slice();

    this._finalStatements.array.push(finalStatement);

    const newFinalStatements = this.getFinalStatements().slice();

    if (save) {
      let toWrite = "";
      if (newFinalStatements.length > 0) {
        const object = {};
        object.array = newFinalStatements;

        toWrite = Convert.objectToJson(object);
      }

      return FileIO.writeStringTo(FilesPath.POP_FINAL_STATEMENTS, toWrite)
        .catch((error) => {
          console.log(error);
          console.dir(error);
          console.trace();

          return this.setFinalStatementsArray(oldFinalStatements, false)
            .then(() => {
              return Promise.reject(error);
            });
        });
    } else {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }

  /**
   * Load and reset functions and sub-functions to load/reset PoP.
   */

  /**
  * Completely resets PoP.
  * @returns {Promise} - a promise that gets completed once PoP has been reset
  */
  reset() {
    this._isLoaded = false;

    const promises = [FileIO.writeStringTo(FilesPath.POP_FINAL_STATEMENTS, ""), FileIO.writeStringTo(FilesPath.POP_TOKEN, "")];

    return Promise.all(promises)
      .then(() => {
        this.emptyFinalStatementArray();
        this.emptyPopTokenArray();

        this._isLoaded = true;

        return Promise.resolve();
      })
      .catch(error => {
        console.log(error);
        console.dir(error);
        console.trace();

        return Promise.reject(error);
      });
  }
}

/**
 * Now we create a singleton object for PoP.
 */

// The symbol key reference that the singleton will use.
const POP_PACKAGE_KEY = Symbol.for(Package.POP);

// We create the singleton if it hasn't been instanciated yet.
const globalSymbols = Object.getOwnPropertySymbols(global);
const popExists = (globalSymbols.indexOf(POP_PACKAGE_KEY) >= 0);

if (!popExists) {
  global[POP_PACKAGE_KEY] = (function () {
    const newPoP = new PoP();
    // TODO: decomment
    //newPoP.load();

    return newPoP;
  })();
}

// Singleton API
const POP = {};

Object.defineProperty(POP, "get", {
  configurable: false,
  enumerable: false,
  get: function () {
    return global[POP_PACKAGE_KEY];
  },
  set: undefined
});

// We freeze the singleton.
Object.freeze(POP);

// We export only the singleton API.
module.exports = POP;
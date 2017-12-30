const Frame = require("ui/frame");
const Dialog = require("ui/dialogs");
const ObservableModule = require("data/observable");
const Convert = require("../../../shared/lib/dedjs/Convert");

const User = require("../../../shared/lib/dedjs/object/user/User").get;
const Org = require("../../../shared/lib/dedjs/object/pop/org/Org").get;

const viewModel = ObservableModule.fromObject({
  linkedConode: Org.getLinkedConodeModule(),
  hash: Org.getPopDescHashModule(),
  toBase64: Convert.byteArrayToBase64
});

function onLoaded(args) {
  const page = args.object;

  // This is to ensure that the hash will be updated in the UI when coming back from the config.
  page.bindingContext = undefined;
  page.bindingContext = viewModel;
}

function linkToConode() {
  if (!User.isKeyPairSet()) {
    return Dialog.alert({
      title: "Key Pair Missing",
      message: "Please generate a key pair.",
      okButtonText: "Ok"
    });
  }

  const conodes = User.getRoster().list;
  const conodesNames = conodes.map(serverIdentity => {
    return serverIdentity.description + " - " + Convert.byteArrayToBase64(serverIdentity.id);
  });

  let index = undefined;

  return Dialog.action({
    message: "Choose a Conode",
    cancelButtonText: "Cancel",
    actions: conodesNames
  })
    .then(result => {
      if (result !== "Cancel") {
        index = conodesNames.indexOf(result);

        return Org.linkToConode(conodes[index], "")
          .then(result => {
            return Dialog.prompt({
              title: "Requested PIN",
              message: result,
              okButtonText: "Link",
              cancelButtonText: "Cancel",
              defaultText: "",
              inputType: Dialog.inputType.text
            })
          })
          .then(result => {
            if (result.result) {
              return Org.linkToConode(conodes[index], result.text)
                .then(result => {
                  return Dialog.alert({
                    title: "Success",
                    message: "Your are now linked to the conode.",
                    okButtonText: "Nice"
                  });
                });
            } else {
              return Promise.resolve();
            }
          });
      } else {
        return Promise.resolve();
      }
    })
    .catch(error => {
      console.log(error);
      console.dir(error);
      console.trace();

      Dialog.alert({
        title: "Error",
        message: "An unexpected error occurred. Please try again. - " + error,
        okButtonText: "Ok"
      });

      return Promise.reject(error);
    });
}

/**
 * Function called when the organizer wants to enter his config/description of the PoP Party.
 */
function configButtonTapped() {
  Frame.topmost().navigate({
    moduleName: "drawers/pop/org/config/config-page"
  });
}

/**
 * Function called when the organizer wants to register the keys of the attendees.
 */
function registerButtonTapped() {
  Frame.topmost().navigate({
    moduleName: "drawers/pop/org/register/register-page"
  });
}

/**
 * Function called when the organizer wants to fetch the final statement of the PoP Party.
 * @returns {*|Promise.<any>}
 */
function fetchButtonTapped() {
  if (!Org.isLinkedConodeSet()) {
    return Dialog.alert({
      title: "Not Linked to Conode",
      message: "Please link to a conode first.",
      okButtonText: "Ok"
    });
  }

  const popDescId = Org.getPopDescHash();
  if (popDescId.length === 0) {
    return Dialog.alert({
      title: "PoP-Description Hash Missing",
      message: "You have to register your PoP-Description first.",
      okButtonText: "Ok"
    });
  }

  return Org.fetchFinalStatement(popDescId)
    .then(() => {
      return Dialog.alert({
        title: "Final Statement Saved",
        message: "The fetched final statement can be found in the PoP tab.",
        okButtonText: "Ok"
      });
    })
    .catch(error => {
      console.log(error);
      console.dir(error);
      console.trace();

      Dialog.alert({
        title: "Error",
        message: "An unexpected error occurred. Please try again. - " + error,
        okButtonText: "Ok"
      });

      return Promise.reject(error);
    });
}

module.exports.onLoaded = onLoaded;
module.exports.configButtonTapped = configButtonTapped;
module.exports.registerButtonTapped = registerButtonTapped;
module.exports.fetchButtonTapped = fetchButtonTapped;
module.exports.linkToConode = linkToConode;

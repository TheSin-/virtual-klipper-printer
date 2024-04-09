// JS assets for plugin klipper
(function () {
    try {
        // source: plugin/klipper/js/klipper.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function () {
          function KlipperViewModel(parameters) {
            var self = this;
        
            self.header = OctoPrint.getRequestHeaders({
              "content-type": "application/json",
              "cache-control": "no-cache",
            });
        
            self.apiUrl = OctoPrint.getSimpleApiUrl("klipper");
            self.Url = OctoPrint.getBlueprintUrl("klipper");
        
            self.settings = parameters[0];
            self.loginState = parameters[1];
            self.connectionState = parameters[2];
            self.levelingViewModel = parameters[3];
            self.paramMacroViewModel = parameters[4];
            self.access = parameters[5];
        
            self.shortStatus_navbar = ko.observable();
            self.shortStatus_navbar_hover = ko.observable();
            self.shortStatus_sidebar = ko.observable();
            self.logMessages = ko.observableArray();
        
            self.popup = undefined;
        
            self._showPopup = function (options) {
              self._closePopup();
              self.popup = new PNotify(options);
            };
        
            self._updatePopup = function (options) {
              if (self.popup === undefined) {
                self._showPopup(options);
              } else {
                self.popup.update(options);
              }
            };
        
            self._closePopup = function () {
              if (self.popup !== undefined) {
                self.popup.remove();
              }
            };
        
            self.showPopUp = function (popupType, popupTitle, message) {
              var title = "OctoKlipper: <br />" + popupTitle + "<br />";
              var options = undefined;
              var errorOpts = {};
        
              options = {
                title: title,
                text: message,
                type: popupType,
                hide: true,
                icon: true
              };
        
              if (popupType == "error") {
        
                errorOpts = {
                  mouse_reset: true,
                  delay: 5000,
                  animation: "none"
                };
                FullOptions = Object.assign(options, errorOpts);
                self._showPopup(FullOptions);
              } else {
                if (options !== undefined) {
                  new PNotify(options);
                }
              }
            };
        
            self.showEditorDialog = function () {
              if (!self.hasRight("CONFIG")) return;
              var editorDialog = $("#klipper_editor");
              editorDialog.modal({
                show: "true",
                width: "90%",
                backdrop: "static",
              });
            }
        
            self.showLevelingDialog = function () {
              var dialog = $("#klipper_leveling_dialog");
              dialog.modal({
                show: "true",
                backdrop: "static",
                keyboard: false,
              });
              self.levelingViewModel.initView();
            };
        
            self.showPidTuningDialog = function () {
              var dialog = $("#klipper_pid_tuning_dialog");
              dialog.modal({
                show: "true",
                backdrop: "static",
                keyboard: false,
              });
            };
        
            self.showOffsetDialog = function () {
              var dialog = $("#klipper_offset_dialog");
              dialog.modal({
                show: "true",
                backdrop: "static",
              });
            };
        
            self.showGraphDialog = function () {
              var dialog = $("#klipper_graph_dialog");
              dialog.modal({
                show: "true",
                width: "90%",
                minHeight: "500px",
                maxHeight: "600px",
              });
            };
        
            self.executeMacro = function (macro) {
              var paramObjRegex = /{(.*?)}/g;
        
              if (!self.hasRight("MACRO")) return;
        
              if (macro.macro().match(paramObjRegex) == null) {
                OctoPrint.control.sendGcode(
                  // Use .split to create an array of strings which is sent to
                  // OctoPrint.control.sendGcode instead of a single string.
                  macro.macro().split(/\r\n|\r|\n/)
                );
              } else {
                self.paramMacroViewModel.process(macro);
        
                var dialog = $("#klipper_macro_dialog");
                dialog.modal({
                  show: "true",
                  backdrop: "static",
                });
              }
            };
        
            self.navbarClicked = function () {
              $("#tab_plugin_klipper_main_link").find("a").click();
            };
        
            self.onGetStatus = function () {
              OctoPrint.control.sendGcode("Status");
            };
        
            self.onRestartFirmware = function () {
              OctoPrint.control.sendGcode("FIRMWARE_RESTART");
            };
        
            self.onRestartHost = function () {
              OctoPrint.control.sendGcode("RESTART");
            };
        
            self.onAfterBinding = function () {
              self.connectionState.selectedPort(
                self.settings.settings.plugins.klipper.connection.port()
              );
            };
        
            self.onDataUpdaterPluginMessage = function (plugin, data) {
        
              if (plugin == "klipper") {
                switch (data.type) {
                  case "PopUp":
                    self.showPopUp(data.subtype, data.title, data.payload);
                    break;
                  case "reload":
                    break;
                  case "console":
                    self.consoleMessage(data.subtype, data.payload);
                    break;
                  case "status":
                    self.shortStatus(data.payload, data.subtype);
                    break;
                  default:
                    self.logMessage(data.time, data.subtype, data.payload);
                    self.shortStatus(data.payload, data.subtype)
                    self.consoleMessage(data.subtype, data.payload);
                }
              }
            };
        
        
            self.shortStatus = function(msg, type) {
        
              var baseText = gettext("Go to OctoKlipper Tab");
              if (msg.length > 36) {
                var shortText = msg.substring(0, 31) + " [..]";
                self.shortStatus_navbar(shortText);
                self.shortStatus_navbar_hover(msg);
              } else {
                self.shortStatus_navbar(msg);
                self.shortStatus_navbar_hover(baseText);
              }
              message = msg.replace(/\n/gi, "<br />");
              self.shortStatus_sidebar(message);
            };
        
        
            self.logMessage = function (timestamp, type = "info", message) {
        
              if (!timestamp) {
                var today = new Date();
                var timestamp =
                  today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
              }
        
              if (type == "error" && self.settings.settings.plugins.klipper.configuration.hide_error_popups() !== true) {
                self.showPopUp(type, "Error:", message);
              }
        
              self.logMessages.push({
                time: timestamp,
                type: type,
                msg: message.replace(/\n/gi, "<br />"),
              });
            };
        
            self.consoleMessage = function (type, message) {
              if (
                self.settings.settings.plugins.klipper.configuration.debug_logging() === true
              ) {
                if (type == "info") {
                  console.info("OctoKlipper : " + message);
                } else if (type == "debug") {
                  console.debug("OctoKlipper : " + message);
                } else {
                  console.error("OctoKlipper : " + message);
                }
              }
              return;
            };
        
            self.onClearLog = function () {
              self.logMessages.removeAll();
            };
        
            self.isActive = function () {
              return self.connectionState.isOperational();
            };
        
            self.hasRight = function (right_role) {
              //if (self.loginState.isAdmin) return true;
              if (right_role == "CONFIG") {
                return self.loginState.hasPermission(
                  self.access.permissions.PLUGIN_KLIPPER_CONFIG
                );
              } else if (right_role == "MACRO") {
                return self.loginState.hasPermission(
                  self.access.permissions.PLUGIN_KLIPPER_MACRO
                );
              }
            };
        
            self.hasRightKo = function (right_role) {
              //if (self.loginState.isAdmin) return true;
              if (right_role == "CONFIG") {
                return self.loginState.hasPermissionKo(
                  self.access.permissions.PLUGIN_KLIPPER_CONFIG
                );
              } else if (right_role == "MACRO") {
                return self.loginState.hasPermissionKo(
                  self.access.permissions.PLUGIN_KLIPPER_MACRO
                );
              }
            };
        
            self.saveOption = function(dir, option, value) {
              if (! (_.includes(["fontsize", "confirm_reload", "parse_check"], option)) ) {
                return;
              }
        
              if (option && dir) {
                let data = {
                  plugins: {
                    klipper:{
                      [dir]: {
                        [option]: value
                      }
                    }
                  }
                };
                OctoPrint.settings
                  .save(data);
              } else if (option) {
                let data = {
                      plugins: {
                        klipper:{
                            [option]: value
                        }
                      }
                  };
                OctoPrint.settings
                  .save(data);
              }
            }
        
            self.requestRestart = function () {
              if (!self.loginState.hasPermission(self.access.permissions.PLUGIN_KLIPPER_CONFIG)) return;
        
              var request = function (index) {
                OctoPrint.plugins.klipper.restartKlipper().done(function (response) {
                  self.consoleMessage("debug", "restartingKlipper");
                  self.showPopUp("success", gettext("Restarted Klipper"), "command: " + response.command);
                });
                if (index == 1) {
                  self.saveOption("configuration", "confirm_reload", false);
                }
              };
        
              var html = "<h4>" +
                          gettext("All ongoing Prints will be stopped!") +
                          "</h4>";
        
              if (self.settings.settings.plugins.klipper.configuration.confirm_reload() == true) {
                showConfirmationDialog({
                  title: gettext("Restart Klipper?"),
                  html: html,
                  proceed: [gettext("Restart"), gettext("Restart and don't ask this again.")],
                  onproceed: function (idx) {
                    if (idx > -1) {
                        request(idx);
                    }
                  },
                });
              } else {
                request(0);
              }
            };
        
            // OctoKlipper settings link
            self.openOctoKlipperSettings = function (profile_type) {
              if (!self.hasRight("CONFIG")) return;
        
              $("a#navbar_show_settings").click();
              $("li#settings_plugin_klipper_link a").click();
              if (profile_type) {
                var query = "#klipper-settings a[data-profile-type='" + profile_type + "']";
                $(query).click();
              }
            };
        
            // trigger tooltip a first time to "enable"
            $("#klipper-copyToClipboard").tooltip('hide');
        
            $("#klipper-copyToClipboard").click(function(event) {
              const ele = $(this);
              const Text = $(this).prev();
              const icon = document.getElementById("klipper-copyToClipboard");
        
              /* Copy the text inside the text field */
              navigator.clipboard.writeText(Text[0].value).then(function () {
                ele.attr('data-original-title', gettext("Copied"));
                ele.tooltip('show');
                icon.classList.add("klipper-animate");
        
                self.sleep(300).then(function () {
                  icon.classList.remove("klipper-animate");
                  $("#klipper-copyToClipboard").attr('data-original-title', gettext("Copy to Clipboard"));
                });
              }, function (err) {
                $("#klipper-copyToClipboard").attr('data-original-title', gettext("Error:") + err);
                $("#klipper-copyToClipboard").tooltip('show');
        
                self.sleep(300).then(function () {
                  $("#copyToClipboard").attr('data-original-title', gettext("Copy to Clipboard"));
                });
              });
            });
        
            self.sleep = function (ms) {
              return new Promise(resolve => setTimeout(resolve, ms));
            };
          }
        
          OCTOPRINT_VIEWMODELS.push({
            construct: KlipperViewModel,
            dependencies: [
              "settingsViewModel",
              "loginStateViewModel",
              "connectionViewModel",
              "klipperLevelingViewModel",
              "klipperMacroDialogViewModel",
              "accessViewModel",
            ],
            elements: [
              "#tab_plugin_klipper_main",
              "#sidebar_plugin_klipper",
              "#navbar_plugin_klipper",
            ],
          });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_settings.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function () {
          $("#klipper-settings a:first").tab("show");
          function KlipperSettingsViewModel(parameters) {
            var self = this;
        
            self.settings = parameters[0];
            self.klipperViewModel = parameters[1];
            self.klipperEditorViewModel = parameters[2];
            self.klipperBackupViewModel = parameters[3];
            self.access = parameters[4];
        
            self.header = OctoPrint.getRequestHeaders({
              "content-type": "application/json",
              "cache-control": "no-cache",
            });
        
            self.markedForFileRemove = ko.observableArray([]);
            self.PathToConfigs = ko.observable("");
        
            $(document).on('shown.bs.modal','#klipper_editor', function () {
              self.klipperEditorViewModel.onShown();
            });
        
            self.checkFontsize = function () {
              if (self.settings.settings.plugins.klipper.configuration.fontsize() > 20) {
                self.settings.settings.plugins.klipper.configuration.fontsize(20)
              } else if (self.settings.settings.plugins.klipper.configuration.fontsize()< 9) {
                self.settings.settings.plugins.klipper.configuration.fontsize(9)
              }
            }
        
            // initialize list helper
            self.configs = new ItemListHelper(
              "klipperCfgFiles",
              {
                name: function (a, b) {
                  // sorts ascending
                  if (a["name"].toLocaleLowerCase() < b["name"].toLocaleLowerCase()) return -1;
                  if (a["name"].toLocaleLowerCase() > b["name"].toLocaleLowerCase()) return 1;
                  return 0;
                },
                date: function (a, b) {
                  // sorts descending
                  if (a["date"] > b["date"]) return -1;
                  if (a["date"] < b["date"]) return 1;
                  return 0;
                },
                size: function (a, b) {
                  // sorts descending
                  if (a["bytes"] > b["bytes"]) return -1;
                  if (a["bytes"] < b["bytes"]) return 1;
                  return 0;
                },
              },
              {},
              "name",
              [],
              [],
              15
            );
        
            self.onStartupComplete = function () {
              self.listCfgFiles();
              self.loadBaseConfig();
            };
        
            self.listCfgFiles = function () {
              self.klipperViewModel.consoleMessage("debug", "listCfgFiles started");
        
              OctoPrint.plugins.klipper.listCfg().done(function (response) {
                self.klipperViewModel.consoleMessage("debug", "listCfgFiles done");
                self.configs.updateItems(response.files);
                self.PathToConfigs(gettext("Path: ") + response.path);
                self.configs.resetPage();
              });
            };
        
            self.loadBaseConfig = function () {
              if (!self.klipperViewModel.hasRight("CONFIG")) return;
        
              var baseconfig = self.settings.settings.plugins.klipper.configuration.baseconfig();
              if (baseconfig != "") {
                self.klipperViewModel.consoleMessage("debug", "loadBaseConfig:" + baseconfig);
                OctoPrint.plugins.klipper.getCfg(baseconfig).done(function (response) {
                  var config = {
                    content: response.response.config,
                    file: baseconfig,
                  };
                  self.klipperEditorViewModel.process(config).then();
                });
              }
            };
        
            self.removeCfg = function (config) {
              if (!self.klipperViewModel.hasRight("CONFIG")) return;
        
              var perform = function () {
                OctoPrint.plugins.klipper
                  .deleteCfg(config)
                  .done(function () {
                    self.listCfgFiles();
                  })
                  .fail(function (response) {
                    var html = "<p>" + _.sprintf(gettext("Failed to remove config %(name)s.</p><p>Please consult octoprint.log for details.</p>"), { name: _.escape(config) });
                    html += pnotifyAdditionalInfo('<pre style="overflow: auto">' + _.escape(response.responseText) + "</pre>");
                    new PNotify({
                      title: gettext("Could not remove config"),
                      text: html,
                      type: "error",
                      hide: false,
                    });
                  });
              };
        
              showConfirmationDialog(
                _.sprintf(gettext('You are about to delete config file "%(name)s".'), {
                  name: _.escape(config),
                }),
                perform
              );
            };
        
            self.markFilesOnPage = function () {
              self.markedForFileRemove(_.uniq(self.markedForFileRemove().concat(_.map(self.configs.paginatedItems(), "file"))));
            };
        
            self.markAllFiles = function () {
              self.markedForFileRemove(_.map(self.configs.allItems, "file"));
            };
        
            self.clearMarkedFiles = function () {
              self.markedForFileRemove.removeAll();
            };
        
            self.removeMarkedFiles = function () {
              var perform = function () {
                self._bulkRemove(self.markedForFileRemove()).done(function () {
                  self.markedForFileRemove.removeAll();
                });
              };
        
              showConfirmationDialog(
                _.sprintf(gettext("You are about to delete %(count)d config files."), {
                  count: self.markedForFileRemove().length,
                }),
                perform
              );
            };
        
            self._bulkRemove = function (files) {
              var title, message, handler;
        
              title = gettext("Deleting config files");
              message = _.sprintf(gettext("Deleting %(count)d config files..."), {
                count: files.length,
              });
        
              handler = function (filename) {
                return OctoPrint.plugins.klipper
                  .deleteCfg(filename)
                  .done(function () {
                    deferred.notify(
                      _.sprintf(gettext("Deleted %(filename)s..."), {
                        filename: _.escape(filename),
                      }),
                      true
                    );
                    self.markedForFileRemove.remove(function (item) {
                      return item.name == filename;
                    });
                  })
                  .fail(function () {
                    deferred.notify(_.sprintf(gettext("Deleting of %(filename)s failed, continuing..."), { filename: _.escape(filename) }), false);
                  });
              };
        
              var deferred = $.Deferred();
              var promise = deferred.promise();
              var options = {
                title: title,
                message: message,
                max: files.length,
                output: true,
              };
              showProgressModal(options, promise);
        
              var requests = [];
              _.each(files, function (filename) {
                var request = handler(filename);
                requests.push(request);
              });
        
              $.when.apply($, _.map(requests, wrapPromiseWithAlways)).done(function () {
                deferred.resolve();
                self.listCfgFiles();
              });
        
              return promise;
            };
        
            self.showBackupsDialog = function () {
              self.klipperViewModel.consoleMessage("debug", "showBackupsDialog");
              self.klipperBackupViewModel.listBakFiles();
              var dialog = $("#klipper_backups_dialog");
              dialog.modal({
                show: "true",
              });
            };
        
            self.showEditor = function () {
              if (!self.klipperViewModel.hasRight("CONFIG")) return;
        
              var editorDialog = $("#klipper_editor");
              editorDialog.modal({
                show: "true",
                width: "90%",
                backdrop: "static",
              });
            }
        
            self.newFile = function () {
              if (!self.klipperViewModel.hasRight("CONFIG")) return;
              var config = {
                content: "",
                file: "Change Filename",
              };
              self.klipperEditorViewModel.process(config).then(
                function() { self.showEditor(); }
              );
            };
        
            self.openConfig = function (file) {
              if (!self.klipperViewModel.hasRight("CONFIG")) return;
        
              OctoPrint.plugins.klipper.getCfg(file).done(function (response) {
                var config = {
                  content: response.response.config,
                  file: file,
                };
                self.klipperEditorViewModel.process(config).then(
                  function() { self.showEditor(); }
                );
              });
            };
        
            self.addMacro = function () {
              self.settings.settings.plugins.klipper.macros.push({
                name: "Macro",
                macro: "",
                sidebar: true,
                tab: true,
              });
            };
        
            self.removeMacro = function (macro) {
              self.settings.settings.plugins.klipper.macros.remove(macro);
            };
        
            self.moveMacroUp = function (macro) {
              self.moveItemUp(self.settings.settings.plugins.klipper.macros, macro);
            };
        
            self.moveMacroDown = function (macro) {
              self.moveItemDown(self.settings.settings.plugins.klipper.macros, macro);
            };
        
            self.addProbePoint = function () {
              self.settings.settings.plugins.klipper.probe.points.push({
                name: "point-#",
                x: 0,
                y: 0,
                z: 0,
              });
            };
        
            self.removeProbePoint = function (point) {
              self.settings.settings.plugins.klipper.probe.points.remove(point);
            };
        
            self.moveProbePointUp = function (macro) {
              self.moveItemUp(self.settings.settings.plugins.klipper.probe.points, macro);
            };
        
            self.moveProbePointDown = function (macro) {
              self.moveItemDown(self.settings.settings.plugins.klipper.probe.points, macro);
            };
        
            self.moveItemDown = function (list, item) {
              var i = list().indexOf(item);
              if (i < list().length - 1) {
                var rawList = list();
                list.splice(i, 2, rawList[i + 1], rawList[i]);
              }
            };
        
            self.moveItemUp = function (list, item) {
              var i = list().indexOf(item);
              if (i > 0) {
                var rawList = list();
                list.splice(i - 1, 2, rawList[i], rawList[i - 1]);
              }
            };
        
            self.onDataUpdaterPluginMessage = function (plugin, data) {
              if (plugin == "klipper" && data.type == "reload" && data.subtype == "configlist") {
                self.klipperViewModel.consoleMessage("debug", "onDataUpdaterPluginMessage klipper reload configlist");
                self.listCfgFiles();
              }
            };
          }
        
          OCTOPRINT_VIEWMODELS.push({
            construct: KlipperSettingsViewModel,
            dependencies: ["settingsViewModel", "klipperViewModel", "klipperEditorViewModel", "klipperBackupViewModel", "accessViewModel"],
            elements: ["#settings_plugin_klipper"],
          });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_leveling.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
         
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
         
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function() {
            function KlipperLevelingViewModel(parameters) {
                var self = this;
                self.settings = parameters[0];
                self.loginState = parameters[1];
                
                self.activePoint = ko.observable(-1);
                self.pointCount = ko.observable();
                self.points = ko.observableArray();
                
                self.initView = function() {
                   self.points(self.settings.settings.plugins.klipper.probe.points());
                   self.pointCount(
                     self.points().length
                   );
                }
        
                self.startLeveling = function() {
                   OctoPrint.control.sendGcode("G28")
                   self.moveToPoint(0);
                }
                
                self.stopLeveling = function() {
                   OctoPrint.control.sendGcode("G1 Z" +
                      (self.settings.settings.plugins.klipper.probe.height()*1 +
                       self.settings.settings.plugins.klipper.probe.lift()*1)
                   );
                   self.gotoHome();
                }
                
                self.gotoHome = function() {
                   OctoPrint.control.sendGcode("G28");
                   self.activePoint(-1);
                }
                
                self.nextPoint = function() {
                   self.moveToPoint(self.activePoint()+1);
                }
                
                self.previousPoint = function() {
                   self.moveToPoint(self.activePoint()-1);
                }
                
                self.jumpToPoint = function(item) {
                   self.moveToPoint(
                      self.points().indexOf(item)
                   );
                }
                /*
                self.pointCount = function() {
                   return self.settings.settings.plugins.klipper.probe.points().length;
                }
                */
                self.moveToPosition = function(x, y) {
                   OctoPrint.control.sendGcode([
                      // Move Z up 
                      "G1 Z" + (self.settings.settings.plugins.klipper.probe.height() * 1 + 
                      self.settings.settings.plugins.klipper.probe.lift()*1) +
                      " F" + self.settings.settings.plugins.klipper.probe.speed_z() ,
                      // Move XY
                      "G1 X" + x + " Y" + y +
                      " F" + self.settings.settings.plugins.klipper.probe.speed_xy() ,
                      // Move Z down
                      "G1 Z" + self.settings.settings.plugins.klipper.probe.height() +
                       " F" + self.settings.settings.plugins.klipper.probe.speed_z()
                   ]);
                }
                
                self.moveToPoint = function(index) {
                   var point = self.points()[index];
        
                   self.moveToPosition(point.x(), point.y());
                   self.activePoint(index);
                }
            }
        
            OCTOPRINT_VIEWMODELS.push({
                construct: KlipperLevelingViewModel,
                dependencies: ["settingsViewModel", "loginStateViewModel"],
                elements: ["#klipper_leveling_dialog"]
            });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_pid_tuning.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
         
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
         
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function() {
            function KlipperPidTuningViewModel(parameters) {
                var self = this;
                
                self.heaterName = ko.observable();
                self.targetTemperature = ko.observable();
                
                self.onStartup = function() {
                   self.heaterName("");
                   self.targetTemperature(190);
                }
                
                self.startTuning = function() {
                   OctoPrint.control.sendGcode("PID_CALIBRATE HEATER=" + self.heaterName() + " TARGET=" + self.targetTemperature());
                }
            }
        
            OCTOPRINT_VIEWMODELS.push({
                construct: KlipperPidTuningViewModel,
                dependencies: [],
                elements: ["#klipper_pid_tuning_dialog"]
            });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_offset.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function () {
          function KlipperOffsetDialogViewModel(parameters) {
            var self = this;
        
            self.klipperViewModel = parameters[0];
        
            self.offsetX = ko.observable();
            self.offsetY = ko.observable();
            self.offsetZ = ko.observable();
            self.adjust = ko.observable();
        
            self.onStartup = function () {
              self.offsetX(0);
              self.offsetY(0);
              self.offsetZ(0);
              self.adjust(false);
            };
        
            self.setOffset = function () {
              if (self.adjust()) {
                self.klipperViewModel.logMessage("","info", "SET_GCODE_OFFSET\n X_ADJUST=" +
                self.offsetX() +
                " Y_ADJUST=" +
                self.offsetY() +
                " Z_ADJUST=" +
                self.offsetZ())
                OctoPrint.control.sendGcode(
                  "SET_GCODE_OFFSET X_ADJUST=" +
                    self.offsetX() +
                    " Y_ADJUST=" +
                    self.offsetY() +
                    " Z_ADJUST=" +
                    self.offsetZ()
                );
              } else {
                self.klipperViewModel.logMessage("","info", "SET_GCODE_OFFSET\n X=" +
                self.offsetX() +
                " Y=" +
                self.offsetY() +
                " Z=" +
                self.offsetZ())
                OctoPrint.control.sendGcode(
                  "SET_GCODE_OFFSET X=" +
                    self.offsetX() +
                    " Y=" +
                    self.offsetY() +
                    " Z=" +
                    self.offsetZ()
                );
              }
            };
        
        
          }
        
          OCTOPRINT_VIEWMODELS.push({
            construct: KlipperOffsetDialogViewModel,
            dependencies: ["klipperViewModel"],
            elements: ["#klipper_offset_dialog"],
          });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_param_macro.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function() {
            function KlipperMacroDialogViewModel(parameters) {
                var self = this;
        
                self.parameters = ko.observableArray();
                self.interpolatedCmd;
                self.macro;
                self.macroName = ko.observable();
        
                var paramObjRegex = /{(.*?)}/g;
                var keyValueRegex = /(\w*)\s*:\s*([\w\s°"|\.]*)/g;
        
                self.process = function(macro) {
                   self.macro = macro.macro();
                   self.macroName(macro.name());
        
                   var matches = self.macro.match(paramObjRegex);
                   var params = [];
        
                   for (var i=0; i < matches.length; i++) {
                      var obj = {};
                      var res = keyValueRegex.exec(matches[i]);
        
                      while (res != null) {
                         if("options" == res[1]) {
                            obj["options"] = res[2].trim().split("|");
                         } else {
                            obj[res[1]] = res[2].trim();
                         }
                         res = keyValueRegex.exec(matches[i]);
                      }
        
                      if(!("label" in obj)) {
                         obj["label"] = "Input " + (i+1);
                      }
        
                      if(!("unit" in obj)) {
                         obj["unit"] = "";
                      }
        
                      if("default" in obj) {
                         obj["value"] = obj["default"];
                      }
        
                      params.push(obj);
                   }
                   self.parameters(params);
                }
        
                self.executeMacro = function() {
                   var i=-1;
        
                   function replaceParams(match) {
                      i++;
                      return self.parameters()[i]["value"];
                   }
                   // Use .split to create an array of strings which is sent to
                   // OctoPrint.control.sendGcode instead of a single string.
                   expanded = self.macro.replace(paramObjRegex, replaceParams)
                   expanded = expanded.split(/\r\n|\r|\n/);
        
                   OctoPrint.control.sendGcode(expanded);
                }
            }
        
            OCTOPRINT_VIEWMODELS.push({
                construct: KlipperMacroDialogViewModel,
                dependencies: [],
                elements: ["#klipper_macro_dialog"]
            });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_graph.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function() {
        
        function KlipperGraphViewModel(parameters) {
           var self = this;
           self.loginState = parameters[0];
        
           self.header = OctoPrint.getRequestHeaders({
              "content-type": "application/json",
              "cache-control": "no-cache"
           });
        
           self.apiUrl = OctoPrint.getSimpleApiUrl("klipper");
        
           self.availableLogFiles = ko.observableArray();
           self.logFile = ko.observable();
           self.klippylogFile = ko.observable();
           self.status = ko.observable();
           self.datasets = ko.observableArray();
           self.datasetFill = ko.observable(false);
           self.canvas;
           self.canvasContext;
           self.chart;
           self.spinnerDialog;
        
           self.onStartup = function() {
              self.canvas = $("#klipper_graph_canvas")[0]
              self.canvasContext = self.canvas.getContext("2d");
              self.spinnerDialog = $("#klipper_graph_spinner");
        
              Chart.defaults.global.elements.line.borderWidth=1;
              Chart.defaults.global.elements.line.fill= false;
              Chart.defaults.global.elements.point.radius= 0;
        
              var myChart = new Chart(self.canvas, {
                 type: "line"
              });
        
              if(self.loginState.loggedIn()) {
                 self.listLogFiles();
              }
           }
        
           self.onUserLoggedIn = function(user) {
              self.listLogFiles();
           }
        
           self.listLogFiles = function() {
              var settings = {
                "crossDomain": true,
                "url": self.apiUrl,
                "method": "POST",
                "headers": self.header,
                "processData": false,
                "dataType": "json",
                "data": JSON.stringify({command: "listLogFiles"})
              }
        
              $.ajax(settings).done(function (response) {
                 self.availableLogFiles.removeAll();
                 self.availableLogFiles(response["data"]);
              });
           }
        
           self.saveGraphToPng = function() {
              button =  $('#download-btn');
              var dataURL = self.canvas.toDataURL("image/png");//.replace("image/png", "image/octet-stream");
              button.attr("href", dataURL);
           }
        
           self.showSpinner = function(showDialog) {
              if (showDialog) {
                 self.spinnerDialog.modal({
                    show: true,
                    keyboard: false,
                    backdrop: "static"
                 });
              } else {
                 self.spinnerDialog.modal("hide");
              }
           }
        
           self.convertTime = function(val) {
              return moment(val, "X");
           }
        
           self.loadData = function() {
              var settings = {
                "crossDomain": true,
                "url": self.apiUrl,
                "method": "POST",
                "headers": self.header,
                "processData": false,
                "dataType": "json",
                "data": JSON.stringify(
                   {
                      command: "getStats",
                      logFile: self.logFile()
                   }
                )
              }
        
              self.showSpinner(true);
        
              $.ajax(settings).done(function (response) {
                 self.status("")
                 self.datasetFill(false);
        
                 self.showSpinner(false);
                 self.klippylogFile(response.logfiledata);
        
                 if("error" in response.plot) {
                    self.status(response.plot.error);
                 } else {
                    self.datasets.removeAll();
                    self.datasets.push(
                    {
                       label: "MCU Load",
                       backgroundColor: "rgba(199, 44, 59, 0.5)",
                       borderColor: "rgb(199, 44, 59)",
                       yAxisID: 'y-axis-1',
                       data: response.plot.loads
                    });
        
                    self.datasets.push(
                    {
                       label: "Bandwith",
                       backgroundColor: "rgba(255, 130, 1, 0.5)",
                       borderColor: "rgb(255, 130, 1)",
                       yAxisID: 'y-axis-1',
                       data: response.plot.bwdeltas
                    });
        
                    self.datasets.push(
                    {
                       label: "Host Buffer",
                       backgroundColor: "rgba(0, 145, 106, 0.5)",
                       borderColor: "rgb(0, 145, 106)",
                       yAxisID: 'y-axis-1',
                       data: response.plot.buffers
                    });
        
                    self.datasets.push(
                    {
                       label: "Awake Time",
                       backgroundColor: "rgba(33, 64, 95, 0.5)",
                       borderColor: "rgb(33, 64, 95)",
                       yAxisID: 'y-axis-1',
                       data: response.plot.awake
                    });
        
                    self.chart = new Chart(self.canvas, {
                       type: "line",
                       data: {
                          labels: response.plot.times,
                          datasets: self.datasets()
                       },
                       options: {
                          elements:{
                             line: {
                                tension: 0
                             }
                          },
                          scales: {
                             xAxes: [{
                                type: 'time',
                                time: {
                                   parser:  self.convertTime,
                                   tooltipFormat: "HH:mm",
                                   displayFormats: {
                                      minute: "HH:mm",
                                      second: "HH:mm",
                                      millisecond: "HH:mm"
                                   }
                                },
                                scaleLabel: {
                                   display: true,
                                   labelString: 'Time'
                                }
                             }],
                             yAxes: [{
                                scaleLabel: {
                                   display: true,
                                   labelString: '%'
                                },
                                position: 'left',
                                id: 'y-axis-1'
                             }
                             ]
                          },
                          legend: {
        
                          }
                       }
                    });
                 }
              });
           }
        
           self.toggleDatasetFill = function() {
              if(self.datasets) {
                 for (i=0; i < self.datasets().length; i++) {
                    self.datasets()[i].fill = self.datasetFill();
                 }
                 if (self.chart) {
                    self.chart.update();
                 }
              }
              return true
           }
        }
        
        OCTOPRINT_VIEWMODELS.push({
              construct: KlipperGraphViewModel,
              dependencies: ["loginStateViewModel"],
              elements: ["#klipper_graph_dialog"]
           });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_backup.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function () {
          function KlipperBackupViewModel(parameters) {
            var self = this;
        
            self.loginState = parameters[0];
            self.klipperViewModel = parameters[1];
            self.access = parameters[2];
        
            self.header = OctoPrint.getRequestHeaders({
              "content-type": "application/json",
              "cache-control": "no-cache",
            });
        
            self.apiUrl = OctoPrint.getSimpleApiUrl("klipper");
            self.Url = OctoPrint.getBlueprintUrl("klipper");
        
            self.markedForFileRestore = ko.observableArray([]);
        
            self.CfgContent = ko.observable();
        
            //uploads
            self.maxUploadSize = ko.observable(0);
            self.backupUploadData = undefined;
            self.backupUploadName = ko.observable();
            self.isAboveUploadSize = function (data) {
              return data.size > self.maxUploadSize();
            };
        
            self.onStartupComplete = function () {
              $('#klipper_backups_dialog').css('display', 'none');
              if (self.loginState.loggedIn()) {
                self.listBakFiles();
              }
            };
        
            // initialize list helper
            self.backups = new ItemListHelper(
              "klipperBakFiles",
              {
                name: function (a, b) {
                  // sorts ascending
                  if (a["name"].toLocaleLowerCase() < b["name"].toLocaleLowerCase()) return -1;
                  if (a["name"].toLocaleLowerCase() > b["name"].toLocaleLowerCase()) return 1;
                  return 0;
                },
                date: function (a, b) {
                  // sorts descending
                  if (a["date"] > b["date"]) return -1;
                  if (a["date"] < b["date"]) return 1;
                  return 0;
                },
                size: function (a, b) {
                  // sorts descending
                  if (a["bytes"] > b["bytes"]) return -1;
                  if (a["bytes"] < b["bytes"]) return 1;
                  return 0;
                },
              },
              {},
              "name",
              [],
              [],
              5
            );
        
            self.listBakFiles = function () {
              self.klipperViewModel.consoleMessage("debug", "listBakFiles");
        
              OctoPrint.plugins.klipper.listCfgBak()
                .done(function (response) {
                  self.backups.updateItems(response.files);
                  self.backups.resetPage();
                });
            };
        
            self.showCfg = function (backup) {
              if (!self.loginState.hasPermission(self.access.permissions.PLUGIN_KLIPPER_CONFIG)) return;
        
              OctoPrint.plugins.klipper.getCfgBak(backup).done(function (response) {
                $('#klipper_backups_dialog textarea').attr('rows', response.response.config.split(/\r\n|\r|\n/).length);
                self.CfgContent(response.response.config);
              });
            };
        
            self.removeCfg = function (backup) {
              if (!self.loginState.hasPermission(self.access.permissions.PLUGIN_KLIPPER_CONFIG)) return;
        
              var perform = function () {
                OctoPrint.plugins.klipper
                  .deleteBackup(backup)
                  .done(function () {
                    self.listBakFiles();
                  })
                  .fail(function (response) {
                    var html = "<p>" + _.sprintf(gettext("Failed to remove config %(name)s.</p><p>Please consult octoprint.log for details.</p>"), { name: _.escape(backup) });
                    html += pnotifyAdditionalInfo('<pre style="overflow: auto">' + _.escape(response.responseText) + "</pre>");
                    new PNotify({
                      title: gettext("Could not remove config"),
                      text: html,
                      type: "error",
                      hide: false,
                    });
                  });
              };
        
              showConfirmationDialog(
                _.sprintf(gettext('You are about to delete backed config file "%(name)s".'), {
                  name: _.escape(backup),
                }),
                perform
              );
            };
        
            self.restoreBak = function (backup) {
              if (!self.loginState.hasPermission(self.access.permissions.PLUGIN_KLIPPER_CONFIG)) return;
        
              var restore = function () {
                OctoPrint.plugins.klipper.restoreBackup(backup).done(function (response) {
                  self.klipperViewModel.consoleMessage("debug", "restoreCfg: " + backup + " / " + response.restored);
                });
              };
        
              var html = "<p>" + gettext("This will overwrite any file with the same name on the configpath.") + "</p>" + "<p>" + backup + "</p>";
        
              showConfirmationDialog({
                title: gettext("Are you sure you want to restore now?"),
                html: html,
                proceed: gettext("Proceed"),
                onproceed: restore,
              });
            };
        
            self.markFilesOnPage = function () {
              self.markedForFileRestore(_.uniq(self.markedForFileRestore().concat(_.map(self.backups.paginatedItems(), "file"))));
            };
        
            self.markAllFiles = function () {
              self.markedForFileRestore(_.map(self.backups.allItems, "file"));
            };
        
            self.clearMarkedFiles = function () {
              self.markedForFileRestore.removeAll();
            };
        
            self.restoreMarkedFiles = function () {
              var perform = function () {
                self._bulkRestore(self.markedForFileRestore()).done(function () {
                  self.markedForFileRestore.removeAll();
                });
              };
        
              showConfirmationDialog(
                _.sprintf(gettext("You are about to restore %(count)d backed config files."), {
                  count: self.markedForFileRestore().length,
                }),
                perform
              );
            };
        
            self.removeMarkedFiles = function () {
              var perform = function () {
                self._bulkRemove(self.markedForFileRestore()).done(function () {
                  self.markedForFileRestore.removeAll();
                });
              };
        
              showConfirmationDialog(
                _.sprintf(gettext("You are about to delete %(count)d backed config files."), {
                  count: self.markedForFileRestore().length,
                }),
                perform
              );
            };
        
            self._bulkRestore = function (files) {
              var title, message, handler;
        
              title = gettext("Restoring klipper config files");
              self.klipperViewModel.consoleMessage("debug", title);
              message = _.sprintf(gettext("Restoring %(count)d backed config files..."), {
                count: files.length,
              });
        
              handler = function (filename) {
                return OctoPrint.plugins.klipper
                  .restoreBackup(filename)
                  .done(function (response) {
                    deferred.notify(
                      _.sprintf(gettext("Restored %(filename)s..."), {
                        filename: _.escape(filename),
                      }),
                      true
                    );
                    self.klipperViewModel.consoleMessage("debug", "restoreCfg: " + filename + " / " + response);
                    self.markedForFileRestore.remove(function (item) {
                      return item.name == filename;
                    });
                  })
                  .fail(function () {
                    deferred.notify(_.sprintf(gettext("Restoring of %(filename)s failed, continuing..."), { filename: _.escape(filename) }), false);
                  });
              };
        
              var deferred = $.Deferred();
        
              var promise = deferred.promise();
        
              var options = {
                title: title,
                message: message,
                max: files.length,
                output: true,
              };
              showProgressModal(options, promise);
        
              var requests = [];
        
              _.each(files, function (filename) {
                var request = handler(filename);
                requests.push(request);
              });
        
              $.when.apply($, _.map(requests, wrapPromiseWithAlways)).done(function () {
                deferred.resolve();
              });
        
              return promise;
            };
        
            self._bulkRemove = function (files) {
              var title, message, handler;
        
              title = gettext("Deleting backup files");
              message = _.sprintf(gettext("Deleting %(count)d backed files..."), {
                count: files.length,
              });
        
              handler = function (filename) {
                return OctoPrint.plugins.klipper
                  .deleteBackup(filename)
                  .done(function () {
                    deferred.notify(_.sprintf(gettext("Deleted %(filename)s..."), { filename: _.escape(filename) }), true);
                    self.markedForFileRestore.remove(function (item) {
                      return item.name == filename;
                    });
                  })
                  .fail(function () {
                    deferred.notify(_.sprintf(gettext("Deleting of %(filename)s failed, continuing..."), { filename: _.escape(filename) }), false);
                  });
              };
        
              var deferred = $.Deferred();
              var promise = deferred.promise();
              var options = {
                title: title,
                message: message,
                max: files.length,
                output: true,
              };
              showProgressModal(options, promise);
        
              var requests = [];
              _.each(files, function (filename) {
                var request = handler(filename);
                requests.push(request);
              });
        
              $.when.apply($, _.map(requests, wrapPromiseWithAlways)).done(function () {
                deferred.resolve();
                self.listBakFiles();
              });
        
              return promise;
            };
          }
        
          OCTOPRINT_VIEWMODELS.push({
            construct: KlipperBackupViewModel,
            dependencies: ["loginStateViewModel", "klipperViewModel", "accessViewModel"],
            elements: ["#klipper_backups_dialog"],
          });
        });
        
        ;
        
        // source: plugin/klipper/js/klipper_editor.js
        // <Octoprint Klipper Plugin>
        
        // This program is free software: you can redistribute it and/or modify
        // it under the terms of the GNU Affero General Public License as
        // published by the Free Software Foundation, either version 3 of the
        // License, or (at your option) any later version.
        
        // This program is distributed in the hope that it will be useful,
        // but WITHOUT ANY WARRANTY; without even the implied warranty of
        // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
        // GNU Affero General Public License for more details.
        
        // You should have received a copy of the GNU Affero General Public License
        // along with this program.  If not, see <https://www.gnu.org/licenses/>.
        
        $(function () {
          function KlipperEditorViewModel(parameters) {
            var self = this;
            var editor = null;
            var editordialog = $("#klipper_editor");
        
            self.settings = parameters[0];
            self.klipperViewModel = parameters[1];
        
            self.CfgFilename = ko.observable("");
            self.CfgContent = ko.observable("");
            self.loadedConfig = "";
            self.CfgChangedExtern = false;
        
            self.header = OctoPrint.getRequestHeaders({
              "content-type": "application/json",
              "cache-control": "no-cache",
            });
        
            $(window).on('resize', function() {
              self.klipperViewModel.sleep(200).then(
                function () {
                  self.setEditorDivSize();
                }
              );
            });
        
            self.onShown = function () {
              self.checkExternChange();
              editor.focus();
              self.setEditorDivSize();
            };
        
            self.close_selection = function (index) {
              switch (index) {
                case 0:
                  editordialog.modal('hide');
                  break;
                case 1:
                  self.editorFocusDelay(1000);
                  break;
                case 2:
                  self.saveCfg({closing: true});
                  break;
              }
            };
        
            self.closeEditor = function () {
              self.CfgContent(editor.getValue());
              if (self.loadedConfig != self.CfgContent()) {
        
                var opts = {
                  title: gettext("Closing without saving"),
                  message: gettext("Your file seems to have changed.")
                    + "<br />"
                    + gettext("Do you really want to close it?"),
                  selections: [gettext("Close"), gettext("Do not close"), gettext("Save & Close")],
                  maycancel: false,
                  onselect: function (index) {
                      if (index > -1) {
                          self.close_selection(index);
                      }
                  },
                };
        
                  showSelectionDialog(opts);
              } else {
                editordialog.modal('hide');
              }
            };
        
            self.addStyleAttribute = function ($element, styleAttribute) {
              $element.attr('style', styleAttribute);
            };
        
            self.setEditorDivSize = function () {
              var klipper_modal_body= $('#klipper_editor .modal-body');
              var klipper_config= $('#plugin-klipper-config');
        
              var height = $(window).height() - $('#klipper_editor .modal-header').outerHeight() - $('#klipper_editor .modal-footer').outerHeight() - 118;
              self.addStyleAttribute(klipper_modal_body, 'height: ' + height + 'px !important;');
              klipper_config.css('height', height);
              if (editor) {
                editor.resize();
              }
            };
        
            //initialize the modal window and return done when finished
            self.process = function (config) {
              return new Promise(function (resolve) {
                self.loadedConfig = config.content;
                self.CfgFilename(config.file);
                self.CfgContent(config.content);
        
                if (editor) {
                  editor.session.setValue(self.CfgContent());
                  self.CfgChangedExtern = false;
                  editor.setFontSize(self.settings.settings.plugins.klipper.configuration.fontsize());
                  editor.clearSelection();
                  self.klipperViewModel.sleep(500).then(
                    function() {
                      self.setEditorDivSize();
                      resolve("done");
                    }
                  );
                }
              });
            };
        
            self.onDataUpdaterPluginMessage = function (plugin, data) {
              //receive from backend after a SAVE_CONFIG
              if (plugin == "klipper" && data.type == "reload" && data.subtype == "config") {
                self.klipperViewModel.consoleMessage("debug", "onDataUpdaterPluginMessage klipper reload baseconfig");
                self.ConfigChangedAfterSave_Config();
              }
            };
        
            //set externally changed config flag if the current file is the base config
            self.ConfigChangedAfterSave_Config = function () {
              if (!self.klipperViewModel.hasRight("CONFIG")) return;
        
              if (self.CfgFilename() == self.settings.settings.plugins.klipper.configuration.baseconfig()) {
                self.CfgChangedExtern = true;
                self.checkExternChange();
              }
            };
        
            //check if the config was externally changed and ask for a reload
            self.checkExternChange = function() {
              var baseconfig = self.settings.settings.plugins.klipper.configuration.baseconfig();
              if (self.CfgChangedExtern && self.CfgFilename() == baseconfig) {
                if (editordialog.is(":visible")) {
        
                  var perform = function () {
                    self.reloadFromFile();
                  }
        
                  var html = "<p>" + gettext("Reload Configfile after SAVE_CONFIG?") + "</p>";
        
                  showConfirmationDialog({
                    title: gettext("Externally changed config") + " " + baseconfig,
                    html: html,
                    proceed: gettext("Proceed"),
                    onproceed: perform,
                  });
                }
              }
            };
        
            self.askSaveFaulty = function () {
              return new Promise(function (resolve) {
                var html = "<h5>" +
                gettext("Your configuration seems to be faulty.") +
                "</h5>";
        
                showConfirmationDialog({
                  title: gettext("Save faulty Configuration?"),
                  html: html,
                  cancel: gettext("Do not save!"),
                  proceed: [gettext("Save anyway!"), gettext("Save anyway and don't ask this again.")],
                  onproceed: function (idx) {
                    if (idx == 0) {
                      resolve(true);
                    } else {
                      self.klipperViewModel.saveOption("configuration", "parse_check", false);
                      resolve(true);
                    }
                  },
                  oncancel: function () {
                    resolve(false);
                  }
                });
              });
            };
        
            self.checkSyntax = function () {
              return new Promise((resolve, reject) => {
                if (editor.session) {
                  self.klipperViewModel.consoleMessage("debug", "checkSyntax started");
        
                  OctoPrint.plugins.klipper.checkCfg(editor.session.getValue())
                    .done(function (response) {
                      if (response.is_syntax_ok == true) {
                        self.klipperViewModel.showPopUp("success", gettext("SyntaxCheck"), gettext("SyntaxCheck OK"));
                        self.editorFocusDelay(1000);
                        resolve(true);
                      } else {
                        self.editorFocusDelay(1000);
                        resolve(false);
                      }
                    })
                    .fail(function () {
                      reject(false);
                    });
                } else { reject(false); }
              });
            };
        
            self.saveCfg = function (options) {
              var options = options || {};
              var closing = options.closing || false;
        
              if (self.CfgFilename() != "") {
                if (editor.session) {
                  if (self.settings.settings.plugins.klipper.configuration.parse_check() == true) {
        
                    // check Syntax and wait for response
                    self.checkSyntax().then((syntaxOK) => {
                      if (syntaxOK === false) {
        
                        // Ask if we should save a faulty config anyway
                        self.askSaveFaulty().then((areWeSaving) => {
                          if (areWeSaving === false) {
                            // Not saving
                            showMessageDialog(
                              gettext('Faulty config not saved!'),
                              {
                                title: gettext("Save Config"),
                                onclose: function () { self.editorFocusDelay(1000); }
                              }
                            );
                          } else {
                            // Save anyway
                            self.saveRequest(closing);
                          }
                        });
                      } else {
                        // Syntax is ok
                        self.saveRequest(closing);
                      }
                    });
                  } else {
                    self.saveRequest(closing);
                  }
                }
              } else {
                showMessageDialog(
                  gettext("No filename set"),
                  {
                    title: gettext("Save Config")
                  }
                );
              }
            };
        
            self.minusFontsize = function () {
              self.settings.settings.plugins.klipper.configuration.fontsize(
                self.settings.settings.plugins.klipper.configuration.fontsize() - 1
              );
        
              if (self.settings.settings.plugins.klipper.configuration.fontsize() < 9) {
                self.settings.settings.plugins.klipper.configuration.fontsize(9);
              }
        
              var fontsize = self.settings.settings.plugins.klipper.configuration.fontsize();
              if (editor) {
                editor.setFontSize(fontsize);
                editor.resize();
              }
        
              self.klipperViewModel.saveOption("configuration", "fontsize", fontsize);
            };
        
            self.plusFontsize = function () {
              self.settings.settings.plugins.klipper.configuration.fontsize(
                self.settings.settings.plugins.klipper.configuration.fontsize() + 1
              );
        
              if (self.settings.settings.plugins.klipper.configuration.fontsize() > 20) {
                self.settings.settings.plugins.klipper.configuration.fontsize(20);
              }
        
              var fontsize = self.settings.settings.plugins.klipper.configuration.fontsize();
              if (editor) {
                editor.setFontSize(fontsize);
                editor.resize();
              }
              self.klipperViewModel.saveOption("configuration", "fontsize", fontsize);
            };
        
            self.reloadFromFile = function () {
              if (self.CfgFilename() != "") {
                OctoPrint.plugins.klipper.getCfg(self.CfgFilename())
                .done(function (response) {
                  self.klipperViewModel.consoleMessage("debug", "reloadFromFile done");
                  if (response.response.text != "") {
                    showMessageDialog(
                      response.response.text,
                      {
                        title: gettext("Reload File")
                      }
                    );
                  } else {
                    self.klipperViewModel.showPopUp("success", gettext("Reload Config"), gettext("File reloaded."));
                    self.CfgChangedExtern = false;
                    if (editor) {
                      editor.session.setValue(response.response.config);
                      self.loadedConfig = response.response.config;
                      editor.clearSelection();
                      editor.focus();
                    }
                  }
                })
                .fail(function (response) {
                  showMessageDialog(
                    response,
                    {
                      title: gettext("Reload File")
                    }
                  );
                });
              } else {
                showMessageDialog(
                  gettext("No filename set"),
                  {
                    title: gettext("Reload File")
                  }
                );
              }
            };
        
            self.onStartup = function () {
              ace.config.set("basePath", "plugin/klipper/static/js/lib/ace/");
              editor = ace.edit("plugin-klipper-config");
              editor.setTheme("ace/theme/monokai");
              editor.session.setMode("ace/mode/klipper_config");
              editor.clearSelection();
        
              editor.setOptions({
                hScrollBarAlwaysVisible: false,
                vScrollBarAlwaysVisible: false,
                autoScrollEditorIntoView: true,
                showPrintMargin: false,
                //maxLines: "Infinity"
              });
        
              editor.session.on('change', function (delta) {
                self.CfgContent(editor.getValue());
                editor.resize();
              });
            };
        
            self.editorFocusDelay = function (delay) {
              self.klipperViewModel.sleep(delay).then(
                function () {
                  editor.focus();
                }
              );
            };
        
            self.saveRequest = function (closing) {
              self.klipperViewModel.consoleMessage("debug", "SaveCfg start");
        
              OctoPrint.plugins.klipper.saveCfg(editor.session.getValue(), self.CfgFilename())
                .done(function (response) {
                  if (response.saved === true) {
                    self.klipperViewModel.showPopUp("success", gettext("Save Config"), gettext("File saved."));
                    self.loadedConfig = editor.session.getValue(); //set loaded config to current for resetting dirtyEditor
                    if (closing) {
                      editordialog.modal('hide');
                    }
                    if (self.settings.settings.plugins.klipper.configuration.restart_onsave() == true) {
                      self.klipperViewModel.requestRestart();
                    }
                  } else {
                    showMessageDialog(
                      gettext('File not saved!'),
                      {
                        title: gettext("Save Config"),
                        onclose: function () { self.editorFocusDelay(1000); }
                      }
                    );
                  }
                });
            };
          }
        
          OCTOPRINT_VIEWMODELS.push({
            construct: KlipperEditorViewModel,
            dependencies: ["settingsViewModel", "klipperViewModel"],
            elements: ["#klipper_editor"],
          });
        });
        
        ;
        
    } catch (error) {
        log.error("Error in JS assets for plugin klipper:", (error.stack || error));
    }
})();

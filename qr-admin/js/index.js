document.addEventListener("DOMContentLoaded", () => {
  !function () {
    var resizer = sideNav.querySelector("qr-resizerx"), sideWidth = 0;
    function collapseMenu() {
      sideWidth = sideNav.offsetWidth;
      document.body.classList.add("left-zero");
      document.body.style.setProperty("--side-width", 0 + "px");
      localStorage.setItem("side-width",  0);
      sessionStorage.setItem("side-width",  0);
    }
    function expandMenu() {
      document.body.classList.remove("left-zero");
      document.body.style.setProperty("--side-width", sideWidth + "px");
      localStorage.setItem("side-width",  sideWidth);
      sessionStorage.setItem("side-width",  sideWidth);
      sideWidth = 0;
    }
    function resize(newWidth) {
      if (newWidth > 600) {
        newWidth = 600;
        if (sideWidth) expandMenu();
      } else if (newWidth > 225) {
        if (sideWidth) expandMenu();
      } else if (newWidth <= 225 && newWidth > 100)  {
        newWidth = 225;
        if (sideWidth) expandMenu();
      } else if (newWidth < 100) {
        newWidth = 0;
        if (!sideWidth) collapseMenu();
      }
      document.body.style.setProperty("--side-width", newWidth + "px");
      localStorage.setItem("side-width",  newWidth);
      sessionStorage.setItem("side-width",  newWidth);
      window.dispatchEvent(new CustomEvent("resize"));
    }
    var width = sessionStorage.getItem("side-width") ?? localStorage.getItem("side-width");
    if (width) {
      sideWidth = +width;
      resize(sideWidth);
    }
    sideNav.addEventListener("click", (e) => {
      e.preventDefault();
    });
    sideNav.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    var removeLoading = qr.lastCall(() => {
      logoIcon.classList.remove("loading");
      statusBox.innerText = "";
      statusBox.style.display = "";
    }, 100);
    var postMessage = (message) => {
      if (Array.isArray(message)) message = message.join("<br>");
      var messageItem = document.createElement("div"),
          text = document.createElement("p"),
          icon = document.createElement("span");
      messageItem.classList.add("message-item");
      text.innerHTML = message;
      icon.onclick = () => messageItem.remove();
      messageItem.append(text, icon);
      messageBox.append(messageItem);
      removeLoading();
    }
    messageBox.postMessage = postMessage;
    rootFolder.addEventListener("error", function (event) {
      var error = event.detail;
      postMessage(error);
    });
    resizer.addEventListener("resizeStart", function () {
      resizer.startWidth = sideNav.offsetWidth;
    });
    resizer.addEventListener("resize", function (event) {
      var newWidth = resizer.startWidth + event.detail;
      resize(newWidth);
    });
    logoIcon.addEventListener("click", function () {
      if (sideWidth) expandMenu();
      else collapseMenu();
      window.dispatchEvent(new CustomEvent("resize"));
    });
    themeIcon.addEventListener("click", function () {
      var isDayTheme = document.body.classList.toggle("day");
      if (isDayTheme) {
        localStorage.setItem("theme-option", "day");
        sessionStorage.setItem("theme-option", "day");
        themeIcon.theme = "day";
      } else {
        localStorage.setItem("theme-option", "night");
        sessionStorage.setItem("theme-option", "night");
        themeIcon.theme = "night";
      }
    });
    if ((sessionStorage.getItem("theme-option") ?? localStorage.getItem("theme-option")) === "night") {
      themeIcon.theme = "night";
    } else {
      themeIcon.theme = "day";
      document.body.classList.add("day");
    }
    window.onstorage = event => { 
      if (event.key !== 'theme-option') return;
      var theme = event.newValue;
      if (theme !== themeIcon.theme) themeIcon.click();
    };
    backward.addEventListener("click", navBar.backward);
    forward.addEventListener("click", navBar.forward);
  }();
  !function () {
    var areaResizer = codeContainer.querySelector("qr-resizerx");
    codeWrapper.addEventListener("pointerdown", function (event) {
      if (event.target?.matches(".CodeMirror-overlayscroll-vertical > div"))
        this.setPointerCapture(event.pointerId);
    });
    themeIcon.addEventListener("click", function () {
      var editor = codeWrapper.getActiveEditor(),
          isDayTheme = themeIcon.theme === "day";
      if (editor) {
        var theme = editor.getOption("theme");
        if (theme === "night" && isDayTheme) {
          editor.setOption("theme", "day");
        } else if (theme === "day" && !isDayTheme) {
          editor.setOption("theme", "night");
        }
      }
    });
    preview.addEventListener("click", function () {
      var on = preview.classList.toggle("on");
      preview.on = on;
      if (on) {
        localStorage.setItem("preview", "on");
        sessionStorage.setItem("preview", "on");
        var areaWidth = (localStorage.getItem("area-width") ?? localStorage.getItem("area-width")) || "50";
        if (areaWidth === 8) areaWidth = "8px";
        else areaWidth = areaWidth + "%";
        document.body.style.setProperty("--area-width", areaWidth);
        areaResizer.style.cursor = "";
        preview.dispatchEvent(new CustomEvent("previewon"));
      } else {
        localStorage.setItem("preview", "off");
        sessionStorage.setItem("preview", "off");
        document.body.style.setProperty("--area-width", "100%");
        areaResizer.style.cursor = "default";
        frameWrapper.innerHTML = "";
        preview.dispatchEvent(new CustomEvent("previewoff"));
      }
      codeWrapper.getActiveEditor()?.refresh();
    });
    areaResizer.addEventListener("resizeStart", function () {
      areaResizer.startWidth = codeContainer.offsetWidth;
    });
    areaResizer.addEventListener("resize", function (event) {
      if (!preview.on) return;
      var newWidth = areaResizer.startWidth + event.detail,
          maxWidth = content.offsetWidth;
      if (newWidth >= maxWidth) newWidth = "100%";
      else if (newWidth <= 8) {
        newWidth = "8px";
      } else newWidth = newWidth / maxWidth * 100 + "%";
      document.body.style.setProperty("--area-width", newWidth);
      localStorage.setItem("area-width", parseFloat(newWidth));
      sessionStorage.setItem("area-width", parseFloat(newWidth));
      window.dispatchEvent(new CustomEvent("resize"));
    });
    lockIcon.unlock = () => {
      lockIcon.locked = false;
      lockIcon.classList.remove("locked");
      localStorage.setItem("locked-url", "");
      sessionStorage.setItem("locked-url", "");
      lockIcon.dispatchEvent(new CustomEvent("unlock"));
    };
    lockIcon.lock = () => {
      lockIcon.locked = true;
      lockIcon.classList.add("locked");
      localStorage.setItem("locked-url", address.value);
      sessionStorage.setItem("locked-url", address.value);
      lockIcon.dispatchEvent(new CustomEvent("lock"));
    };
    lockIcon.addEventListener("click", function () {
      if (!address.value) return;
      if (this.locked) this.unlock();
      else this.lock();
    });
    !function () {
      var previewStatus = (sessionStorage.getItem("preview") ?? localStorage.getItem("preview")) || "off";
      if (previewStatus === "on") {
        preview.on = true;
        preview.classList.add("on");
        areaResizer.style.cursor = "";
      } else {
        localStorage.setItem("preview", "off");
        sessionStorage.setItem("preview", "off");
        document.body.style.setProperty("--area-width", "100%");
        areaResizer.style.cursor = "default";
      }
      var areaWidth = sessionStorage.getItem("area-width") ?? localStorage.getItem("area-width");
      if (areaWidth && preview.on) {
        areaWidth = +areaWidth;
        if (areaWidth === 8) areaWidth = "8px";
        else areaWidth = areaWidth + "%";
        document.body.style.setProperty("--area-width", areaWidth);
      }
      var lockedUrl = sessionStorage.getItem("locked-url") ?? localStorage.getItem("locked-url");
      if (lockedUrl) {
        lockIcon.locked = true;
        address.value = lockedUrl;
        lockIcon.classList.add("locked");
      }
      searchBar.addEventListener("click", function () {
        frameWrapper.getActiveFrame()?.focus();
      });
      searchBar.addEventListener("pointerdown", function (e) {
        e.preventDefault();
      });
    }();
  }();
  !function () {
    Object.assign(CodeMirror.defaults, {
      styleActiveLine: true,
      lineNumbers: true,
      lineWrapping: true,
      gutters: ["breakpoints", "CodeMirror-linenumbers", "CodeMirror-foldgutter"],
      autoCloseBrackets: true,
      matchTags: {bothTags: true},
      matchBrackets: true,
      highlightSelectionMatches: {showToken: /""/, annotateScrollbar: true},
      foldGutter: true,
      scrollbarStyle: "overlay",
      undoDepth: 1000,
      historyEventDelay: 1500,
      dragDrop: false,
      resetSelectionOnContextMenu: false,
      workTime: 250, 
      workDelay: 250,
      maxHighlightLength: 100000,
      keyMap: "sublime",
      scrollPastEnd: true,
      autoCloseTags: true,
      extraKeys: {
        "Ctrl-J": "toMatchingTag",
        "F11": function(cm) {
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
          if (cm.getOption("fullScreen"))
            window.content.style.zIndex = "5";
          else 
            window.content.style.zIndex = "";
        },
        "Esc": function(cm) {
          if (cm.getOption("fullScreen")) { 
            cm.setOption("fullScreen", false);
            window.content.style.zIndex = "";
          }
        },
        "Tab": function(cm) {
          if (cm.somethingSelected()) 
            CodeMirror.commands.defaultTab(cm);
          else
            cm.execCommand("indentMore");
        }
      },
    });
    function getMimetype(a) {
      var val = a, m, mode, spec, ext;
      if (m = /.+\.([^.]+)$/.exec(val)) {
        ext = m[1].toLowerCase();
        if (ext === "jsp") return "application/x-httpd-jsp"
        var info = CodeMirror.findModeByExtension(ext);
        if (info) {
          mode = info.mode;
          spec = info.mime;
        }
      } else if (/\//.test(val)) {
        var info = CodeMirror.findModeByMIME(val);
        if (info) {
          mode = info.mode;
          spec = val;
        }
      } else {
        mode = spec = val;
      }
      if (mode) {
        if (spec === "text/javascript") return "text/jsx";
        if (spec === "text/x-php") return "application/x-httpd-php";
        return spec; 
      } else {
        return "text/plain";
      }
    }
    var getEditor = qr.cacheCall((page, queue) => {
          page.getContents().then(response => {
            var error, contents, readOnly = false;
            if (!response) error = "[Binary Data] not supported for edit.";
            else ({error, contents} = response);
            if (error) {
              readOnly = "nocursor";
              contents = error;
            }
            var cm = CodeMirror(function(elt) {
                  queue.resolve(elt);
                }, {
                  value: contents,
                  mode: readOnly ? "text/plain" : getMimetype(page.getAttribute("href")),
                  theme: themeIcon.theme,
                  readOnly
                }), doc = cm.doc;
            cm.on("change", () => {
              navBar.pinPage();
              if (doc.isClean(doc.generation)) {
                page.classList.remove("unsaved");
              } else {
                page.classList.add("unsaved");
              }
            });
            function updateLine(num, str2) {
              var str1 = doc.getLine(num);
              var length1 = str1.length, length2 = str2.length;
              var result;
              for (let i = 0;; i++) {
                if (i < length1 && i < length2) {
                  if (str1[i] !== str2[i]) {
                    for (let ii = i, j = 0;; ii++, j++) {
                      if (ii < length1 && ii < length2) {
                        if (str1[length1 - 1 - j] !== str2[length2 - 1 - j]) {
                          result = {start: i, end: length1 - j, text: str2.slice(i, length2 - j)};
                          break;
                        }
                      } else {
                        result = {start: i, end: length1 - j, text: str2.slice(i, length2 - j)};
                        break;
                      }
                    }
                    break;
                  }
                } else {
                  result = {start: i, end: length1, text: str2.slice(i)};
                  break;
                }
              }
              doc.replaceRange(
                result.text, 
                {line: num, ch: result.start}, 
                {line: num, ch: result.end}
              );
            }
            doc.updateValue = (newValue) => {
              var lines = newValue.split("\n"), length2 = lines.length;
              for (let i = 0;; i++) {
                let text1 = doc.getLine(i);
                let text2 = lines[i];
                let length1 = doc.lineCount();
                if (i < length1 && i < length2) {
                  if (text1 !== text2) {
                    let numSet = [], offset = length2 - length1, smallest;
                    if (offset >= 0) {
                      for (let ii = i; ii < length1; ii++) {
                        let text1 = doc.getLine(ii);
                        for (let iii = ii; iii < length2; iii++) {
                          let text2 = lines[iii];
                          if (text1 === text2) {
                            numSet.push([ii, iii]);
                          }
                        }
                      }
                    } else {
                      for (let ii = i; ii < length2; ii++) {
                        let text2 = lines[ii];
                        for (let iii = ii; iii < length1; iii++) {
                          let text1 = doc.getLine(iii);
                          if (text1 === text2) {
                            numSet.push([iii, ii]);
                          }
                        }
                      }
                    }
                    smallest = numSet.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]))[0];
                    if (smallest) {
                      let passage = lines.slice(i, smallest[1]), lineCounts = passage.length, t;
                      if (!lineCounts) {
                        doc.replaceRange("", {line: i, ch: 0}, {line: smallest[0], ch: 0});
                      } else {
                        if (smallest[0] - i > 0) {
                          updateLine(i, passage[0]);
                          if (lineCounts > 0) {
                            t = passage.slice(1).join("\n");
                            if (t) t += "\n";
                            doc.replaceRange(t, {line: i + 1, ch: 0}, {line: smallest[0], ch: 0});
                          }
                        } else {
                          doc.replaceRange(
                            passage.join("\n") + "\n", 
                            {line: i, ch: 0}, 
                            {line: smallest[0], ch: 0}
                          );
                        }
                      }
                      i = smallest[1];
                    } else {
                      let passage = lines.slice(i);
                      let lineCounts = passage.length;
                      if (length1 - 1 - i > 0) {
                        updateLine(i, passage[0]);
                        if (lineCounts > 0) {
                          t = passage.slice(1).join("\n");
                          if (t) t = "\n" + t;
                          doc.replaceRange(t, {line: i, ch: Infinity}, {line: Infinity, ch: 0});
                        }
                      } else {
                        doc.replaceRange(
                          passage.join("\n"), 
                          {line: i, ch: 0}, 
                          {line: Infinity, ch: 0}
                        );
                      }
                      break;
                    }
                  }
                } else if (i < length1) {
                  doc.replaceRange(
                    "",
                    {line: i - 1, ch: Infinity},
                    {line: length1, ch: 0}
                  );
                  break;
                } else if (i < length2) {
                  doc.replaceRange(
                    "\n" + lines.slice(i).join("\n"),
                    {line: i - 1, ch: Infinity},
                    {line: length1, ch: 0}
                  );
                  break;
                } else break;
              }
            };
          }).catch(error => {
            console.log(error);
            queue.reject(`Failed to fetch file: ${page.getAttribute("href")}.`);
          });
        });
    var editorGallery = getEditor.map;
    var getActiveEditor = () => codeWrapper.firstElementChild?.CodeMirror;
    codeWrapper.getActiveEditor = getActiveEditor;
    navBar.addEventListener("pageUpdate", event => {
      var page = event.detail;
          editor = editorGallery.get(page);
      if (editor) editor.CodeMirror.setOption("mode", getMimetype(page.getAttribute("href")));
    });
    navBar.addEventListener("pageOpen", event => {
      var page = event.detail;
      codeWrapper.innerHTML = "";
      getEditor(page).then((editorElem) => {
        var theme = themeIcon.theme,
            editor = editorElem.CodeMirror,
            theme2 = editor.getOption("theme");
        if (theme !== theme2) editor.setOption("theme", theme);
        codeWrapper.append(editorElem);
        editor.refresh();
        if (!sideNav.contains(document.activeElement))
          editor.focus();
      }, error => {
        messageBox.postMessage(error);
      });
    });
    navBar.addEventListener("pageClose", event => {
      if (!navBar.getActivePage()) codeWrapper.innerHTML = "";
    });
    navBar.addEventListener("pageDelete", event => {
      var editorElem = editorGallery.get(event.detail);
      if (editorElem) {
        editorGallery.delete(event.detail);
        if (codeWrapper.contains(editorElem)) editorElem.remove();
      }
    });
    var updateEditor = (page, contents, readOnly) => {
      var editorElem = editorGallery.get(page);
      if (editorElem) {
        let editor = editorElem.CodeMirror,
            doc = editor.doc;
        if (!doc.isClean(doc.generation)) return;
        editor.setOption("readOnly", readOnly);
        if (contents === doc.getValue()) return;
        if (contents === doc.getValue("\n")) return;
        doc.updateValue(contents);
        doc.generation = doc.changeGeneration();
        page.classList.remove("unsaved");
      }
    };
    navBar.addEventListener("pointerdown", event => {
      var editor = getActiveEditor();
      if (editor) setTimeout(() => {
        editor.focus();
      });
    });
    refresh.addEventListener("click", () => {
      var page = navBar.getActivePage(),
          editor = getActiveEditor();

      if (page && editor) {
        page.getContents().then(response => {
          var error, contents, readOnly = false;
          if (!response) error = "[Binary Data] not supported for edit.";
          else ({error, contents} = response);
          if (error) {
            readOnly = "nocursor";
            contents = error;
          }
          updateEditor(page, contents, readOnly);
        });
      }
    });
    navBar.putContents = () => {
      var page = navBar.getActivePage(),
          editor = getActiveEditor();
      if (page) navBar.pinPage();
      if (editor) {
        if (editor.getOption("readOnly")) return;
        let doc = editor.doc;
        page.putContents(
          doc.getValue()
        ).then((result) => {
          if (result) {
            messageBox.postMessage(JSON.parse(result).error);
          } else {
            doc.generation = doc.changeGeneration();
            page.classList.remove("unsaved");
            codeWrapper.dispatchEvent(new CustomEvent("pageSave"));
          }
        }, (error) => {
          console.log(error);
        });
      }
    };
    save.addEventListener("click", navBar.putContents);
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey) {
        var cmd = e.key.toLowerCase();
        if ("serqko".indexOf(cmd) !== -1) {
          e.preventDefault();
          if (cmd === "s") navBar.putContents();
          if (cmd === "r") refresh.click();
          if (cmd === "q") {
            let page = navBar.getActivePage();
            if (page) window.open(page.href);
          }
        }
      }
    });
  }();
  !function () {
    var frameGallery = new Map;
    var createFrame = (page) => {
          var frame = document.createElement("iframe");
          var closeButton = document.createElement("div");
          closeButton.style.cssText = "float:right; width: 20px; cursor: pointer;";
          closeButton.innerHTML = "&#x21F1;";
          frame.addEventListener("load", () => {
            var wd = frame.contentWindow;
            if (frame.src !== "about:blank") {
              wd.addEventListener("scroll", () => {
                if (frame.cancelScroll) return;
                frame.xScroll = wd.scrollX;
                frame.yScroll = wd.scrollY;
              });
              wd.addEventListener("keydown", function (e) {
                if (e.ctrlKey) {
                  var cmd = e.key.toLowerCase();
                  if ("srqko".indexOf(cmd) !== -1) {
                    e.preventDefault();
                  }
                }
              });
              wd.scrollTo(frame.xScroll, frame.yScroll);
            } else {
              var body = wd.document.body;
              body.appendChild(closeButton);
              closeButton.onclick = () => {
                frame.outerWindow.close();
                frameWrapper.update();
              };
              wd.addEventListener("unload", function () {
                setTimeout(() => !frameWrapper.contains(frame) && !frame.outerWindow.closed && frame.outerWindow.close());
              });
              frame.outerWindow.location.reload();
            }
          });
          frame.linkedPage = page;
          frame.outerWindow = null;
          frameGallery.set(page, frame)
          return frame;
        }
    var getFrame = page => frameGallery.get(page) ?? createFrame(page);
    var activeFrame = null, getActiveFrame = () => activeFrame;
        frameWrapper.getActiveFrame = getActiveFrame;
        frameWrapper.update = () => {
          var outerWindow;
          if (activeFrame) {
            if ((outerWindow = activeFrame.outerWindow) && !outerWindow.closed) {
              activeFrame.src = "about:blank";
            } else {
              activeFrame.outerWindow = null;
              activeFrame.src = address.value + `?_=${Math.random()}`;
            }
          }
        };
    var updateFrame = (page) => {
          var frame = getFrame(page), location = origin + page.getAttribute("href");
          if (!lockIcon.locked) {
            address.value = location;
          } else {
            location = address.value;
            localStorage.setItem("locked-url", location);
            sessionStorage.setItem("locked-url", location);
          }
          if (!frame) return;
          if (frame === activeFrame) {
            var extention = qrFolder.getExtention(location);
            if (!extention || "zip,exe".indexOf(qrFolder.getExtention(location)) === -1) {
              frameWrapper.update();
            } else frame.src = "";
          } else if (lockIcon.locked && activeFrame) {
            frameWrapper.update();
          }
        };
    var openFrame = (page, passive) => {
          if (!page) {
            frameWrapper.innerHTML = "";
            address.value = "";
            if (lockIcon.locked) lockIcon.unlock();
            localStorage.setItem("locked-url", "");
            sessionStorage.setItem("locked-url", "");
            return;
          }
          if (!lockIcon.locked || !activeFrame) {
            var frame = getFrame(page), location = origin + page.getAttribute("href");
            if (frame !== activeFrame) {
              if (activeFrame) {
                try {
                  activeFrame.xScroll = activeFrame.contentWindow?.scrollX;
                  activeFrame.yScroll = activeFrame.contentWindow?.scrollY;
                } catch (error) {}
                activeFrame.cancelScroll = true;
                setTimeout(() => {activeFrame && (activeFrame.cancelScroll = false)});
                activeFrame.hidden = true;
              }
              frame.hidden = false;
              activeFrame = frame;
              if (!frameWrapper.contains(frame)) {
                updateFrame(page);
                frameWrapper.append(frame);
                if (frame.src === "about:blank") frame.src = location + `?_=${Math.random()}`;
              }
              if (!frame.src) {
                updateFrame(page);
              } else {
                try {
                  frame.contentWindow.scrollTo(frame.xScroll, frame.yScroll);
                } catch (error) {}
                if (!lockIcon.locked) {
                  if (passive) updateFrame(page);
                  else address.value = location;
                }
              }
            } else {
              if (!lockIcon.locked) {
                if (address.value !== location) {
                  updateFrame(page);
                }
              }
            }
          }
        };
    var closeFrame = (page, toDelet) => {
          var frame = frameGallery.get(page);
          if (frame) {
            if (lockIcon.locked && frame === activeFrame) {
            } else if (frameWrapper.contains(frame)) {
              frame.remove();
            }
            if (toDelet) frameGallery.delete(page);
          }
          if (!navBar.getActivePage() && !lockIcon.locked) {
            activeFrame = null;
            frameWrapper.innerHTML = "";
            address.value = "";
          }
        };
    navBar.addEventListener("pageUpdate", event => {
      if (!preview.on) return;
      var page = event.detail;
      if (lockIcon.locked) {
        if (page.getAttribute("href") === address.value) {
          updateFrame(page);
        } else if (frameGallery.get(page) === activeFrame) {
          address.value = origin + page.getAttribute("href");
          updateFrame(page);
        }
      } else updateFrame(page);
    });
    navBar.addEventListener("pageOpen", event => {
      if (!preview.on) return;
      openFrame(event.detail);
    });
    navBar.addEventListener("pageClose", event => {
      if (!preview.on) return;
      closeFrame(event.detail);
    });
    navBar.addEventListener("pageDelete", event => {
      if (!preview.on) return;
      closeFrame(event.detail, true);
    });
    codeWrapper.addEventListener("pageSave", () => {
      if (!preview.on) return;
      if (activeFrame) updateFrame(navBar.getActivePage());
    });
    lockIcon.addEventListener("unlock", () => {
      if (!preview.on) return;
      page = activeFrame?.linkedPage;
      if (!navBar.contains(page)) closeFrame(page);
      openFrame(navBar.getActivePage(), true);
    });
    openIcon.addEventListener("click", () => {
      if (!address.value) return;
      activeFrame.outerWindow?.close();
      activeFrame.src = "about:blank";
      var outerWindow = window.open(address.value);
      activeFrame.outerWindow = outerWindow;
    });
    preview.addEventListener("previewon", () => {
      openFrame(navBar.getActivePage(), true);
    });
    preview.addEventListener("previewoff", () => {
      activeFrame = null;
    });
    window.addEventListener("unload", () => {
      navBar.getPages().forEach(page => {
        var outerWindow;
        if (outerWindow = frameGallery.get(page)?.outerWindow) outerWindow.close();
      });
    });
  }();
});
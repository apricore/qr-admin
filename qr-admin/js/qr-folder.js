{
  let pathname = location.pathname.replaceAll(/(\/|\\)+/g, "/"),
  names = pathname.split("/");
  names[names.length-1] = "";
  let pathname2 = names.join("/");
  if (pathname !== pathname2) location = pathname2;
}
customElements.define("qr-dialog", class extends HTMLElement {
  constructor() {
    super();
    var {title, message, input, buttons, ok, cancel} = this;
    var finalize = (event) => {
          if (event && this.contains(event.target)) return;
          window.removeEventListener("click", finalize, {capture: true});
          if (!event) buttons.firstElementChild?.click();
          this.className = "off";
          input.onblur = null;
          ok.onblur = null;
        };
    var initialize = (ttl, msg) => {
          if (!document.body.contains(this)) document.body.append(this);
          title.innerHTML = ttl;
          message.innerHTML = msg;
          input.value = msg;
          buttons.innerHTML = "";
          this.innerHTML = "";
          this.className = "off";
          requestAnimationFrame(() => this.className = "on");
        };
    this.alert = function (ttl = "", msg = "") {
      initialize(ttl, msg);
      buttons.append(ok);
      this.append(title, message, buttons);
      input.onblur = null;
      ok.onblur = ok.focus;
      ok.focus();
      return new Promise((resolve, reject) => {
        ok.onclick = () => resolve();
      }).finally(finalize);
    };
    this.confirm = function (ttl = "", msg = "") {
      initialize(ttl, msg, cancel, ok);
      buttons.append(cancel, ok);
      this.append(title, message, buttons);
      input.onblur = null;
      ok.onblur = ok.focus;
      ok.focus();
      return new Promise((resolve, reject) => {
        ok.onclick = () => {
          resolve(true);
        };
        cancel.onclick = () => {
          resolve(false);
        };
      }).finally(finalize);
    };
    this.prompt = function (ttl = "", msg = "") {
      initialize(ttl, msg, cancel, ok);
      buttons.append(cancel, ok);
      this.append(title, input, buttons);
      ok.onblur = null;
      input.onblur = input.focus;
      input.select();
      return new Promise((resolve, reject) => {
        ok.onclick = () => {
          resolve(input.value);
        };
        cancel.onclick = () => {
          resolve(null);
        };
      }).finally(finalize);
    };
    this.addEventListener("transitionend", () => {
      if (this.className === "off")
        this.className = "";
      else if (event.propertyName === "top" && this.className === "on")
        window.addEventListener("click", finalize, {capture: true});
    });
    input.onkeydown = event => {
      if (event.key === "Enter") ok.click();
      else if (event.key === "Escape") cancel.click();
    };
    ok.onkeydown = event => {
      if (event.key === "Enter") ok.click();
      else if (event.key === "Escape") cancel.click();
      return false;
    };
  }
  title = qr.createElement("p");
  message = qr.createElement("p");
  input = qr.createElement("input", {}, elem => elem.onkeypress = event => {
    if (event.key === "Enter") this.ok.click()
  });
  buttons = qr.createElement("div");
  ok = qr.createElement("button", {class: "ok"}, "OK");
  cancel = qr.createElement("button", {class: "cancel"}, "Cancel");
  rendered = false;
});
customElements.define("qr-slidery", class extends HTMLElement {
  connectedCallback() {
    if (this.rendered) return;
    var slider = this.slider,
        thumb = this.thumb,
        shiftY, slideStart = event => {
          event.preventDefault();
          shiftY = event.clientY - thumb.getBoundingClientRect().top;
          thumb.setPointerCapture(event.pointerId);
          thumb.onpointermove = slide;
          this.dispatchEvent(new CustomEvent("slideStart"));
        }, slide = event => {
          let newTop = event.clientY - shiftY - slider.getBoundingClientRect().top,
              bottomEdge = slider.offsetHeight - thumb.offsetHeight;
          if (newTop < 0) {
            newTop = 0;
          } else if (newTop > bottomEdge) {
            newTop = bottomEdge;
          }
          thumb.style.top = newTop + "px";
          this.scrolling = true;
          this.dispatchEvent(new CustomEvent("slide", {
            detail: {
              slidedPortion: newTop / bottomEdge
            }
          }));
        };
    slider.className = "slider-trackY";
    slider.addEventListener("pointerdown", event => {
      if (event.target !== slider) return;
      let heigth = thumb.offsetHeight, bottomEdge = slider.offsetHeight - heigth,
          newTop = event.clientY - slider.getBoundingClientRect().top - heigth / 2;
      if (newTop < 0) {
        newTop = 0;
      } else if (newTop > bottomEdge) {
        newTop = bottomEdge;
      }
      thumb.style.top = newTop + "px";
      slideStart(event);
      this.dispatchEvent(new CustomEvent("slide", {
        detail: {
          slidedPortion: newTop / bottomEdge
        }
      }));
    });
    thumb.className = "slider-thumbY";
    thumb.onlostpointercapture = event => {
      thumb.onpointermove = null;
      this.scrolling = false;
      this.dispatchEvent(new CustomEvent("slideEnd"));
    };
    thumb.addEventListener("pointerdown", slideStart);
    thumb.ondragstart = () => false;
    slider.append(thumb);
    this.append(slider);
    this.addEventListener("update", event => {
      var portion = event.detail.slidedPortion, length = event.detail.length,
          maxHeight = slider.offsetHeight;
      if (portion > 1) portion = 1;
      else if (portion < 0) portion = 0;
      if (length < maxHeight) {
        if (length > 24)
          thumb.style.height = length + "px";
        else if (length === 0) {
          thumb.style.height = 0 + "px";
          this.hidden = true;
        } else {
          thumb.style.height = Math.min(maxHeight / 2, 24) + "px";
        }
      } else {
        thumb.style.height = 0 + "px";
        this.hidden = true;
      }
      var newTop = portion * (maxHeight - thumb.offsetHeight);
      thumb.style.top = newTop + "px";
    });
    this.scrolling = false;
    this.rendered = true;
    this.linkElement = (elem) => {
      var updateScroll = () => {
            this.hidden = false;
            this.dispatchEvent(new CustomEvent("update", {
              detail: {
                slidedPortion: elem.scrollTop / (elem.scrollHeight - elem.clientHeight),
                length: elem.clientHeight / elem.scrollHeight * slider.offsetHeight
              }
            }));
          }, endEvent = qr.lastCall(updateScroll, 100);
      elem.updateScroll = () => {
        updateScroll();
        endEvent();
      };
      elem.addEventListener("scroll", elem.updateScroll);
      this.addEventListener("slide", (e) => {
        elem.scrollTop = e.detail.slidedPortion * (elem.scrollHeight - elem.clientHeight);
      });
      window.addEventListener("resize", elem.updateScroll);
    };
    this.dispatchEvent(new CustomEvent("connect"));
  }
  slider = document.createElement("div");
  thumb = document.createElement("div");
  rendered = false;
});
customElements.define("qr-sliderx", class extends HTMLElement {
  connectedCallback() {
    if (this.rendered) return;
    var slider = this.slider,
        thumb = this.thumb,
        shiftX, slideStart = event => {
          event.preventDefault();
          shiftX = event.clientX - thumb.getBoundingClientRect().left;
          thumb.setPointerCapture(event.pointerId);
          thumb.onpointermove = slide;
          this.dispatchEvent(new CustomEvent("slideStart"));
        }, slide = event => {
          let newLeft = event.clientX - shiftX - slider.getBoundingClientRect().left,
              rightEdge = slider.offsetWidth - thumb.offsetWidth;
          if (newLeft < 0) {
            newLeft = 0;
          } else if (newLeft > rightEdge) {
            newLeft = rightEdge;
          }
          thumb.style.left = newLeft + "px";
          this.scrolling = true;
          this.dispatchEvent(new CustomEvent("slide", {
            detail: {
              slidedPortion: newLeft / rightEdge
            }
          }));
        };
    slider.className = "slider-trackX";
    slider.addEventListener("pointerdown", event => {
      if (event.target !== slider) return;
      let heigth = thumb.offsetWidth, rightEdge = slider.offsetWidth - heigth,
          newLeft = event.clientX - slider.getBoundingClientRect().left - heigth / 2;
      if (newLeft < 0) {
        newLeft = 0;
      } else if (newLeft > rightEdge) {
        newLeft = rightEdge;
      }
      thumb.style.left = newLeft + "px";
      slideStart(event);
      this.dispatchEvent(new CustomEvent("slide", {
        detail: {
          slidedPortion: newLeft / rightEdge
        }
      }));
    });
    thumb.className = "slider-thumbX";
    thumb.onlostpointercapture = event => {
      thumb.onpointermove = null;
      this.scrolling = false;
      this.dispatchEvent(new CustomEvent("slideEnd"));
    };
    thumb.addEventListener("pointerdown", slideStart);
    thumb.ondragstart = () => false;
    slider.append(thumb);
    this.append(slider);
    this.addEventListener("update", event => {
      var portion = event.detail.slidedPortion, length = event.detail.length,
          maxWidth = slider.offsetWidth;
      if (portion > 1) portion = 1;
      else if (portion < 0) portion = 0;
      if (length < maxWidth) {
        if (length > 24)
          thumb.style.width = length + "px";
        else {
          thumb.style.width = Math.min(maxWidth / 2, 24) + "px";
        }
      } else {
        thumb.style.width = 0 + "px";
        this.hidden = true;
      }
      var newLeft = portion * (maxWidth - thumb.offsetWidth);
      thumb.style.left = newLeft + "px";
    });
    this.scrolling = false;
    this.rendered = true;
    this.linkElement = (elem) => {
      var updateScroll = () => {
            this.hidden = false;
            this.dispatchEvent(new CustomEvent("update", {
              detail: {
                slidedPortion: elem.scrollLeft / (elem.scrollWidth - elem.clientWidth),
                length: elem.clientWidth / elem.scrollWidth * slider.offsetWidth
              }
            }));
          }, endEvent = qr.lastCall(updateScroll, 100);
      elem.updateScroll = () => {
        updateScroll();
        endEvent();
      };
      elem.addEventListener("scroll", elem.updateScroll);
      this.addEventListener("slide", (e) => {
        elem.scrollLeft = e.detail.slidedPortion * (elem.scrollWidth - elem.clientWidth);
      });
      window.addEventListener("resize", elem.updateScroll);
    };
    this.dispatchEvent(new CustomEvent("connect"));
  }
  slider = document.createElement("div");
  thumb = document.createElement("div");
  rendered = false;
});
customElements.define("qr-resizery", class extends HTMLElement {
  connectedCallback() {
    if (this.rendered) return;
    var initY, pointermove = event => {
          this.dispatchEvent(new CustomEvent("resize", {
            detail: event.clientY - initY
          }));
        };
    this.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.setPointerCapture(event.pointerId);
      this.addEventListener("pointermove", pointermove);
      this.dispatchEvent(new CustomEvent("resizeStart"));
    });
    this.addEventListener("gotpointercapture", event => {
      initY = event.clientY;
    });
    this.addEventListener("lostpointercapture", () => {
      this.removeEventListener("pointermove", pointermove);
      this.dispatchEvent(new CustomEvent("resizeEnd"));
    });
    this.rendered = true;
  }
  rendered = false;
});
customElements.define("qr-resizerx", class extends HTMLElement {
  connectedCallback() {
    if (this.rendered) return;
    var initX, pointermove = event => {
          this.dispatchEvent(new CustomEvent("resize", {
            detail: event.clientX - initX
          }));
        };
    this.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.setPointerCapture(event.pointerId);
      this.addEventListener("pointermove", pointermove);
      this.dispatchEvent(new CustomEvent("resizeStart"));
    });
    this.addEventListener("gotpointercapture", event => {
      initX = event.clientX;
    });
    this.addEventListener("lostpointercapture", () => {
      this.removeEventListener("pointermove", pointermove);
      this.dispatchEvent(new CustomEvent("resizeEnd"));
    });
    this.rendered = true;
  }
  rendered = false;
});
customElements.define("qr-page", class extends HTMLElement {
  constructor() {
    super();
    var rootFolder = qrFolder.rootFolder,
        pageArr = new Proxy(new IndexArray, {
          set() {
            updatePage();
            return Reflect.set(...arguments);
          }
        });
    var updatePage = qr.firstCall(() => {
      var children = this.children;
      for (let i = 0, pageToRemove = [];; i++) {
        if (i < pageArr.length && i < children.length) {
          let child = children[i], item = pageArr[i], 
              name = item.name, inode = item.inode,
              page = getPage(name, inode);
          if (child !== page) child.before(page);
        } else if (i < pageArr.length) {
          let item = pageArr[i], name = item.name, 
              inode = item.inode, page = getPage(name, inode);
          this.append(page);
        } else if (i < children.length) {
          let child = children[i];
          pageToRemove.push(child);
        } else {
          for (let page of pageToRemove) {
            page.remove();
            this.dispatchEvent(new CustomEvent("pageClose", {
              detail: page
            }));
          }
          break;
        }
      }
      window.dispatchEvent(new CustomEvent("resize"));
      localStorage.setItem("page-mapper", JSON.stringify(pageArr));
      sessionStorage.setItem("page-mapper", JSON.stringify(pageArr));
    });
    var pageGallery = {}, pageOrder = [], activePageInode, 
        pinedPageInode = sessionStorage.getItem("unpined-page") ?? localStorage.getItem("unpined-page");
        this.pageGallery = pageGallery;
    var getPage = (name, inode) => {
      var page = pageGallery[inode];
      if (!page) {
        var page = qr.createElement("a", {
          class: "qr-page",
          draggable: true
        }), pageText = qr.createElement("span", {
          class: "page-text"
        }), delIcon = qr.createElement("span", {
          class: "del-icon"
        }), dirpath = qr.createElement("span", {
          class: "dirpath"
        });
        page.append(pageText, dirpath, delIcon);
        Object.defineProperty(page, "name", {
          set(value) {
            page.href = value;
            pageText.innerText = qrFolder.baseName(value);
          },
          get() {
            return page.getAttribute("href");
          }
        });
        page.getContents = function () {
          return rootFolder.request("getContents", "json", {location: this.getAttribute("href")});
        };
        page.putContents = function (contents) {
          return rootFolder.request("putContents", "text", {
            location: this.getAttribute("href"),
            contents
          });
        };
        page.name = name;
        page.inode = inode;
        page.pagetText = pageText;
        page.delIcon = delIcon;
        page.dirpath = dirpath;
        pageGallery[inode] = page;
        setTimeout(() => {
          var page2;
          if (page2 = this.querySelector(`.qr-page[href$="/${qrFolder.baseName(page.name)}"]`)) 
            aDirpath(page2);
        });
      }
      if (page.name !== name) {
        page.name = name;
      }
      if (pinedPageInode === inode) {
        page.classList.add("unpined");
        pinedPageInode = 0;
      }
      if (activePageInode === inode) {
        page.classList.add("active");
        activePageInode = 0;
      }
      return page;
    };
    this.getPage = getPage;
    var getActivePage = () => pageGallery[pageOrder[pageOrder.length - 1]];
    this.getActivePage = getActivePage;
    var openPage = qr.lastCall((page) => {
      if (!page) return;
      var location = page.name, inode = page.inode, index;
      this.querySelector(".qr-page.active")?.classList.remove("active");
      page.classList.add("active");
      index = pageOrder.indexOf(inode);
      pageOrder.splice(index, 1);
      pageOrder.push(inode);
      localStorage.setItem("page-order", JSON.stringify(pageOrder));
      sessionStorage.setItem("page-order", JSON.stringify(pageOrder));
      rootFolder.selectFile(inode, location);
      page.scrollIntoView();
      this.dispatchEvent(new CustomEvent("pageOpen", {
        detail: page
      }));
    });
    this.openPage = openPage;
    var closePage = (page) => {
      if (!page) return;
      var index = pageOrder.indexOf(page.inode);
      page.classList.remove("active");
      page.classList.remove("unpined");
      if (index !== -1) pageOrder.splice(index, 1);
      pageArr.delete(page.name);
      deDirpath(page);
      localStorage.setItem("page-order", JSON.stringify(pageOrder));
      sessionStorage.setItem("page-order", JSON.stringify(pageOrder));
    };
    this.closePage = closePage;
    var pinPage = () => {
      var unpinedPage = this.querySelector(".unpined");
      if (unpinedPage === getActivePage()) unpinedPage.classList.remove("unpined");
      localStorage.setItem("unpined-page", "");
      sessionStorage.setItem("unpined-page", "");
    };
    this.pinPage = pinPage;
    this.getPages = () => this.querySelectorAll(".qr-page");
    function setDirpath(pages) {
      if (pages.length < 2) {
        if (pages[0]) pages[0].dirpath.innerText = "";
        return;
      }
      let from = 1, dirname;
      outer: while (true) {
        dirname = pages[0].name.split("/")[from];
        for (let page of pages) {
          if (dirname != page.name.split("/")[from]) break outer;
        }
        from++;
      }
      for (let page of pages) {
        let nameseq = page.name.split("/");
        page.dirpath.innerText = ((from > 1) ? "…/" : "") + nameseq.slice(from, nameseq.length - 1).join("/")
      }
    }
    var aDirpath = (page) => {
      setDirpath(this.querySelectorAll(`.qr-page[href$="/${qrFolder.baseName(page.name)}"]`));
    };
    var deDirpath = (page) => {
      page.dirpath.innerText = "";
      setDirpath([...this.querySelectorAll(`.qr-page[href$="/${qrFolder.baseName(page.name)}"]`)].filter(a => a != page))
    };
    this.forward = () => {
      if (pageOrder.length) openPage(pageGallery[pageOrder[0]]);
    };
    this.backward = () => {
      if (pageOrder.length) {
        pageOrder.unshift(pageOrder.splice(pageOrder.length - 1, 1)[0]);
        openPage(pageGallery[pageOrder[pageOrder.length - 1]]);
      }
    };
    this.addEventListener("pointerdown", function (event) {
      var target = event.target;
      if (target.classList.contains("del-icon")) {
        event.preventDefault();
      } else {
        openPage(target.closest(".qr-page"));
      }
    });
    this.addEventListener("dragstart", event => {
      var page = event.target;
      if (!page) return;
      event.dataTransfer.setData("name", page.name);
      page.classList.add("onDrag");
      this.dragStarted = true;
      requestAnimationFrame(() => page.classList.remove("onDrag"));
    });
    this.addEventListener("dragenter", event => {
      event.preventDefault();
      var page = event.target.closest(".qr-page");
      if (!this.dragStarted) return;
      if (!page || page === this.querySelector(".qr-page.active")) return;
      this.querySelector(".draggedOn")?.classList.remove("draggedOn");
      page.classList.add("draggedOn");
    });
    this.addEventListener("dragover", event => {
      event.preventDefault();
    });
    this.addEventListener("dragleave", event => {
      var page = event.target.closest(".qr-page.draggedOn");
      if (event.relatedTarget?.closest(".qr-page.draggedOn") !== page)
        page?.classList.remove("draggedOn");
    });
    this.addEventListener("drop", event => {
      var page = event.target.closest(".qr-page.draggedOn"),
          name1 = event.dataTransfer.getData("name"),
          name2 = page?.name;
      if (name1 && name2) pageArr.explace(name1, name2);
    });
    this.addEventListener("dragend", event => {
      this.querySelector(".draggedOn")?.classList.remove("draggedOn");
      this.dragStarted = false;
    });
    this.addEventListener("wheel", event => {
      if (this.offsetWidth === this.scrollWidth) return;
      event.preventDefault();
      var delta = event.deltaY || event.deltaX;
      if (Math.abs(delta) >= 100) delta *= 0.2;
      this.scrollLeft += delta;
    }, { passive: false });
    this.addEventListener("click", event => {
      event.preventDefault();
      var target = event.target,
          page = target.closest(".qr-page");
      if (target.classList.contains("del-icon")) {
        closePage(page);
        openPage(getActivePage());
      }
    });
    window.addEventListener("load", async () => {
      var pageOrderProps = JSON.parse(sessionStorage.getItem("page-order") ?? localStorage.getItem("page-order")),
          pageMapperValues = JSON.parse(sessionStorage.getItem("page-mapper") ?? localStorage.getItem("page-mapper")),
          inodes = [];
      if (!pageOrderProps?.length) return;
      for (let i = 0; i < pageMapperValues.length; i++) {
        let filepath = pageMapperValues[i].name, inode = (await rootFolder.getFileInode(filepath));
        if (inode != "-1") {
          pageArr.set({name: filepath, inode});
          inodes.push(inode);
          rootFolder.deepIntoFile(filepath, false).catch(error => console.log(error));
        }
      }
      for (let fnum of pageOrderProps) if (inodes.includes(fnum)) pageOrder.push(fnum);
      activePageInode = pageOrderProps[pageOrderProps.length - 1];
      setTimeout(() => {
        this.nextElementSibling.linkElement(this);
        this.updateScroll();
        openPage(getActivePage());
      });
      localStorage.setItem("page-order", JSON.stringify(pageOrder));
      sessionStorage.setItem("page-order", JSON.stringify(pageOrder));
      localStorage.setItem("page-mapper", JSON.stringify(pageArr));
      sessionStorage.setItem("page-mapper", JSON.stringify(pageArr));
    }, {once: true});
    rootFolder.addEventListener("fileselected", event => {
      var file = event.detail.fileElem,
          name = file.getAttribute("href"),
          inode = file.fnum,
          page = pageGallery[inode],
          index = pageArr.indexOf(getActivePage()?.name);
      if (pageArr.has(name)) {
        if (page !== this.querySelector(".qr-page.active")) openPage(page);
      } else {
        if (index !== -1) pageArr.set({name, inode}, index + 1);
        else pageArr.set({name, inode});
        pageOrder.push(inode);
        closePage(this.querySelector(".qr-page.unpined"));
        sessionStorage.setItem("unpined-page", inode);
        localStorage.setItem("unpined-page", inode);
        pinedPageInode = inode;
        activePageInode = inode;
        setTimeout(() => {
          var page = pageGallery[inode];
          openPage(page);
          aDirpath(page);
        });
      }
    });
    rootFolder.addEventListener("filerenamed", event => {
      var {oldHref, newHref} = event.detail, page = pageGallery[pageArr[oldHref]?.inode];
      if (pageArr.has(oldHref)) {
        deDirpath(page);
        pageArr.rename(oldHref, newHref);
        setTimeout(() => {
          aDirpath(page);
          if (page === getActivePage()) openPage(page);
          this.dispatchEvent(new CustomEvent("pageUpdate", {detail: page}));
        });
      }
    });
    rootFolder.addEventListener("filedeleted", event => {
      var fileElem = event.detail.fileElem, inode = fileElem.fnum,
          page = pageGallery[inode];
      if (page) {
        delete pageGallery[inode];
        if (pageArr.has(page.name)) {
          closePage(page);
          openPage(getActivePage());
        }
        this.dispatchEvent(new CustomEvent("pageDelete", {detail: page}));
      }
    });
    rootFolder.addEventListener("folderdeleted", event => {
      var fileElem = event.detail.fileElem, location = fileElem.src;
      for (let inode in pageGallery) {
        let page = pageGallery[inode],
            name = page.name;
        if (name.indexOf(location) === 0) {
          delete pageGallery[inode];
          if (pageArr.has(name)) {
            closePage(page);
          }
          this.dispatchEvent(new CustomEvent("pageDelete", {detail: page}));
        }
      }
      openPage(getActivePage());
    });
  }
});
class IndexArray extends Array {
  set(value, index) {
    var name = value?.name;
    if (typeof name !== "string" || !isNaN(name)) return;
    if (this.has(name)) this.delete(name);
    if (index) this.splice(index, 0, value);
    else this.push(value);
    this[name] = value;
  }
  has(name) {
    if (typeof name !== "string") name = name?.name;
    return name in this;
  }
  get(name) {
    return this[name];
  }
  delete(name) {
    var index, value;
    if (typeof name === "string") {
      value = this[name];
    } else {
      value = name;
    }
    index = this.indexOf(value);
    if (index !== -1) {
      this.splice(index, 1);
      delete this[value.name];
    }
  }
  rename(name, nName) {
    var index, value;
    if (typeof name === "string") {
      value = this[name];
    } else {
      value = name;
    }
    index = this.indexOf(value);
    if (index !== -1) {
      delete this[value.name];
      value.name = nName;
      this[nName] = value;
    }
  }
  explace(name1, name2) {
    var index1, value1, index2, value2;
    if (typeof name1 === "string") {
      value1 = this[name1];
    } else {
      value1 = name1;
    }
    if (typeof name2 === "string") {
      value2 = this[name2];
    } else {
      value2 = name2;
    }
    index1 = this.indexOf(value1);
    index2 = this.indexOf(value2);
    if (index1 !== -1 && index2 !== -1) {
      if (index1 < index2) {
        this.splice(index2 + 1, 0, value1);
        this.splice(index1, 1);
      } else if (index1 > index2) {
        this.splice(index2, 0, value1);
        this.splice(index1 + 1, 1);
      }
    }
  }
  indexOf(name) {
    var value;
    if (typeof name === "string") value = this[name];
    else value = name;
    return super.indexOf(value);
  }
  keys() {
    var keys = [];
    for (let key in this) if (isNaN(key)) keys.push(key);
    return keys;
  }
}
class qr {
  static Queue = class {
    constructor(callback) {
      var queue = Object.create(null);
      queue.then = (resolve, reject) => {
        var result = this.results.shift(),
        error = this.errors.shift();
        if (error === this.empty) resolve(result);
        else if (result === this.empty) reject(error);
        else {
          this.resolves.push(resolve);  
          this.rejects.push(reject);
        }
      }
      this.then = async (resolve, reject) => {
        if (this.canceled) return;
        try {
          var result = await queue;
          this.result = result;
          this.error = null;
          return resolve?.(result);
        } catch (error) {
          this.error = error;
          this.result = null;
          return reject?.(error);
        } finally { callback?.(this); }
      };
      this.invoke = () => {
        if (this.canceled) {
          this.canceled = false;
          callback?.(this);
        }
      };
      this.invoke();
    }
    result = null;
    error = null;
    results = []; errors = []; 
    resolves = []; rejects = [];
    empty = Symbol(); canceled = true;
    resolve(result) {
      var resolve = this.resolves.shift();
      this.rejects.shift();
      if (resolve) {
        this.error = null;
        this.result = result;
        resolve(result);
      } else {
        this.results.push(result);
        this.errors.push(this.empty);
      }
    }
    reject(error) {
      var reject = this.rejects.shift();
      this.resolves.shift();
      if (reject) {
        this.result = null;
        this.error = error;
        reject(error);
      } else {
        this.results.push(this.empty);
        this.errors.push(error);
      }
    }
    cancel() {
      this.results.length = 0;
      this.errors.length = 0;
      this.resolves.length = 0;
      this.rejects.length = 0;
      this.canceled = true;
    }
  }
  static syncCall(func) {
    var queue = new this.Queue,
    rtn = new this.Queue(() => queue.resolve()),
    wrapper = async function () {
      await queue;
      func(...arguments, rtn);
      return rtn;
    };
    rtn.length = () => queue.resolves.length + 1;
    wrapper.resolve = (a) => rtn.resolve(a);
    wrapper.reject = (e) => rtn.reject(e);
    return wrapper;
  }
  static cacheCall(func) {
    var map = new WeakMap,
    queue = new this.Queue,
    rtn = new this.Queue((rtn) => {
      var result = rtn.result;
      var backRef = rtn.backRef;
      if (result && backRef) {
        result.backRef = backRef;
        map.set(backRef, result);
      }
      rtn.backRef = undefined;
      queue.resolve();
    });
    var wrapper = (name) => {
      queue.then(() => {
        var item = map.get(name);
        if (item) rtn.resolve(item);
        else {
          rtn.backRef = name;
          func(name, rtn);
        }
      });
      return rtn;
    };
    wrapper.map = map;
    return wrapper;
  }
  static firstCall(func, delay) {
    if (delay === undefined) {
      var queue = new this.Queue(function (a) {
        var init = !a.results.length;
        a.then(function (value) {
          if (init) func(value);
        });
      });
      return queue.resolve.bind(queue);
    } else {
      var timeout, init = true;
      return function () {
        if (init) {
          func(...arguments);
          init = false;
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => init = true, +delay || 0);
      }
    }
  }
  static lastCall(func, delay) {
    if (delay === undefined) {
      var queue = new this.Queue(function (a) {
        a.then(function (value) {
          if (!a.results.length) func(value);
        });
      });
      return queue.resolve.bind(queue);
    } else {
      var timeout;
      return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func.bind(null, ...arguments), +delay || 0);
      }
    }
  }
  static asyncCall(a, b, delay) {
    var func = this.lastCall(b, delay);
    return function () {
      a(...arguments, func);
    }
  }
  static createElement(tagName, attribute={}, text="") {
    var elem = document.createElement(tagName);
    for (let attr in attribute) {
      elem.setAttribute(attr, attribute[attr]);
    }
    elem.innerHTML = text;
    return elem;
  }
}
class qrFolder extends HTMLElement {
  connectedCallback() {
    if (this.rendered) return;
    if (!qrFolder.rootFolder) qrFolder.setUp.call(this);
    var root = qrFolder.rootFolder;
    root.request("getFiles", "json", {location: this.src}).then((response) => {
      if (response.error) throw response.error;
      var head = this.head,
          body = this.body;
      head.href = this.src;
      head.innerText = qrFolder.baseName(response.name);
      this.refresh(response);
      head.addEventListener("click", event => {
        root.resizeEvent();
        head.after(this.body);
        head.addEventListener("click", event => {
          if (event.ctrlKey || head.contentEditable === "plaintext-only") return;
          root.resizeEvent();
          var isOpen = head.parentNode.classList.toggle("opened"),
              scrollHeight = body.scrollHeight;
          if (root === this || !event.isTrusted || !scrollHeight) return;
          if (isOpen) {
            body.style.height = "0px";
            body.style.height = body.scrollHeight + "px";
          } else {
            body.style.height = "auto";
            body.style.height = body.scrollHeight + "px";
            requestAnimationFrame(() => body.style.height = "");
          }
        });
        this.settedUp = true;
        this.dispatchEvent(new CustomEvent("settedUp"));
        if (!(event.ctrlKey || head.contentEditable === "plaintext-only")) {
          head.parentNode.classList.add("opened");
          var scrollHeight = body.scrollHeight;
          if (!scrollHeight) return;
          body.style.height = "0px";
          body.style.height = body.scrollHeight + "px";
        }
      }, {once: true});
      var resizeEvent = () => {
        requestAnimationFrame(() => {
          root.body.updateScroll();
          root.resizeDone || resizeEvent();
        });
      }
      body.addEventListener("transitionstart", (event) => {
        event.stopPropagation();
        root.resizeDone && resizeEvent();
        root.resizeDone = false;
      });
      body.addEventListener("transitionend", (event) => {
        event.stopPropagation();
        root.resizeDone = true;
        body.style.height = "";
      });
      this.initiated = true;
      this.dispatchEvent(new CustomEvent("initiated"));
    }, error => {
      console.log(error);
      root.dispatchEvent(new CustomEvent("error", {detail: `Error: server cannot be reached`}));
    }).catch(error => {
      console.log(error);
      root.dispatchEvent(new CustomEvent("error", {
        detail: `Error: reading folder: ${this.src}`
      }));
    });
    this.append(this.head);
    this.rendered = true;
  }
  refresh(response) {
    var items = response.body,
        root = this.root,
        folder = this,
        children = folder.body.children;
    this.head.innerText = response.name;
    for (let i = 0, fileToRemove = [];; i++) {
      if (i < items.length && i < children.length) {
        var elem = root.setQrFile(items[i].location, items[i].inode);
        if (children[i] !== elem) {
          root.resizeEvent();
          children[i].before(elem); 
        }
      } else if (i < items.length) {
        root.resizeEvent();
        folder.body.append(root.setQrFile(items[i].location, items[i].inode));
      } else if (i < children.length) {
        root.fileGarbage.push(children[i]);
        fileToRemove.push(children[i]);
      } else {
        for (let i = 0; i < fileToRemove.length; i++) {
          root.resizeEvent();
          fileToRemove[i].remove();
        }
        break;
      };
    }
    folder.dispatchEvent(new CustomEvent("refreshed"));
  }
  set src(value) {this.setAttribute("src", value)}
  get src() {return this.getAttribute("src")}
  head = qrFolder.createElement("a", {class: "dir-title"}, "...");
  body = qrFolder.createElement("div", {class: "dir-body"});
  rendered = false;
  initiated = false;
  settedUp = false;
  refreshed = false;
  resizeDone = true;
  static get observedAttributes() {
    return ["src"];
  }
  static setUp() {
    qrFolder.rootFolder = this;
    qrFolder.prototype.root = this;
    function handleResponse(message) {
      switch (message.action) {
        case "deleteFiles": {
            let {deletedFiles} = message;
            for (let location of deletedFiles) {
              let inode = fileReference.get(location),
                  file = fileGallery[inode];
              rootFolder.resizeEvent();
              if (file instanceof qrFolder) {
                let folder = file;
                if (folder) {
                  folder.remove();
                  (function removeFolder(folder) {
                    var subFiles = folder.querySelectorAll(".dir-body > *");
                    for (let fileElem of subFiles) {
                      let location;
                      if (location = fileElem.getAttribute("href")) {
                        delete fileGallery[fileElem.fnum];
                        fileReference.delete(location);
                      } else if (location = fileElem.src) {
                        removeFolder(fileElem);
                      }
                    }
                    delete fileGallery[folder.fnum];
                    fileReference.delete(folder.src);
                  })(folder);
                  rootFolder.dispatchEvent(new CustomEvent("folderdeleted", {
                    detail: {
                      fileElem: folder
                    }
                  }));
                }
              } else if (file) {
                file.remove();
                delete fileGallery[inode];
                fileReference.delete(location);
                rootFolder.dispatchEvent(new CustomEvent("filedeleted", {
                  detail: {
                    fileElem: file
                  }
                }));
              }
            }
        } break;
        default: {
          let dirpath = message.dirpath;
          deepIntoFile(dirpath, !qrFolder.isDir(dirpath)).catch(error => console.log(error));
          fileGallery[fileReference[dirpath]]?.refresh(message);
        }
      }
    }
    const HttpRequest = (modify) => {
      var xhttp = new XMLHttpRequest(), url = new URL(origin);
      if (modify) modify(xhttp);
      return qr.syncCall((action, responseType, body, queue) => {
        xhttp.onload = () => {
          var response = xhttp.response, status = xhttp.status;
          if (status === 200) {
            queue.resolve(response)
          } else {
            queue.reject(status + " " + xhttp.statusText);
          }
        };
        xhttp.onerror = (error) => queue.reject(error);
        if (action.indexOf("uploadFiles") === 0) {
          xhttp.open("POST", qrFolder.origin + "upload.jsp?action=" + action);
          xhttp.responseType = responseType;
          xhttp.setRequestHeader("username", "qr-admin");
          xhttp.send(body);
        } else {
          xhttp.open("POST", qrFolder.origin + "api.php?action=" + action);
          xhttp.responseType = responseType;
          xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          for (let item in body) url.searchParams.set(item, body[item]);
          xhttp.responseType = responseType; 
          xhttp.send(url.search.slice(1));
        }
      });
    }
    var fileGallery = {0: this}, fileReference = {
      __proto__: {
        get(prop) {
          return this[prop];
        },
        set(prop, value) {
          if (this[prop] !== undefined) delete this[this[prop]];
          if (this[value] !== undefined) delete this[this[value]];
          this[prop] = value;
          this[value] = prop;
        },
        delete(prop) {
          delete this[this[prop]];
          delete this[prop];
        },
        has(prop) {
          return prop in this;
        }
      },
      "/": "0"
    }, fileGarbage = [], request = HttpRequest();
    this.fileGallery = fileGallery;
    this.fileReference = fileReference;
    var createQrFolder = (location, fnum) => {
        var folder = qrFolder.createElement("qr-folder", {
          src: location
        });
        folder.fnum = fnum;
        fileGallery[fnum] = folder;
        fileReference.set(location, fnum);
        var src = folderTemplate.getAttribute("src");
        if (src) {
          if (src === location) {
            folder.addEventListener("refreshed", () => {
              folder.head.focus();
            }, {once: true});
          }
          folderTemplate.setAttribute("src", "");
        }
        return folder;
      }, createQrFile = (location, fnum) => {
        var qrFile = qrFolder.createElement("a", {
          href: location,
          class: "qr-file"
        }, qrFolder.baseName(location));
        qrFile.fnum = fnum;
        fileGallery[fnum] = qrFile;
        fileReference.set(location, fnum);
        var href = fileTemplate.getAttribute("href");
        if (href) {
          if (href === location) {
            setTimeout(() => qrFile.click());
          }
          fileTemplate.href = "";
        }
        return qrFile;
      }, updateFile = (fileElem, location) => {
        var prevLocation = fileElem.getAttribute("href");
        fileElem.href = location;
        this.dispatchEvent(new CustomEvent("filerenamed", {
          detail: {
            fileElem: fileElem,
            oldHref: prevLocation,
            newHref: location
          }
        }));
        fileElem.classList.remove("selected");
        fileReference.set(location, fileElem.fnum);
      }, updateFolder = (folderElem, location, level=0) => {
        var oldSrc = folderElem.src;
        folderElem.src = location;
        fileReference.set(location, folderElem.fnum);
        if (!folderElem.rendered) return;
        folderElem.head.href = location;
        folderElem.head.classList.remove("selected");
        var children = folderElem.body.children;
        for (let i = 0; i < children.length; i++) {
          var child = children[i];

          if (children[i].tagName === "QR-FOLDER") {
            if (level > location.split("/").length - 1) return;
            updateFolder(child, child.src.replace(oldSrc, location), ++level);
          } else
            updateFile(child, child.getAttribute("href").replace(oldSrc, location));
        }
      }, setQrFile = (location, fnum) => {
        var qrFile = fileGallery[fnum], name = qrFolder.baseName(location);
        if (qrFolder.isDir(location)) {
          if(!qrFile) return createQrFolder(location, fnum);

          if (qrFile.src !== location) updateFolder(qrFile, location);
          if (qrFile.head.innerText !== name) qrFile.head.innerText = name;
        } else {
          if(!qrFile) return createQrFile(location, fnum);
          if (qrFile.getAttribute("href") !== location) updateFile(qrFile, location);
          if (qrFile.innerText !== name) qrFile.innerText = name;
        }
        var index = fileGarbage.indexOf(qrFile);
        if (index !== -1) fileGarbage.splice(index, 1);
        return qrFile;
      }
    this.request = request; 
    this.fileGarbage = fileGarbage; 
    this.setQrFile = setQrFile;
    this.body.tabIndex = -1;
    this.resizeEvent = qr.asyncCall((a) => {
      a(this.body.scrollHeight);
    }, (b) => {
      if (this.body.scrollHeight !== b)
        this.dispatchEvent(new CustomEvent("resize"));
    }, 0);
    var focusHandler = qr.lastCall((eventName) => {
          if (eventName === "focusin") {
            this.classList.add("focused");
          } else if (eventName === "focusout") {
            this.classList.remove("focused");
          }
        }, 0);
    this.addEventListener("focusin", () => {
      focusHandler("focusin");
    });
    this.addEventListener("focusout", () => {
      focusHandler("focusout");
    });
    var selectedFiles = this.getElementsByClassName("selected"),
        isFileElem = (elem) => {
          if (!elem.getAttribute("href")) return;
          return (
            elem.classList.contains("dir-title") ||
            elem.classList.contains("qr-file")
          );
        }
    var toggleSelect = (elem, first) => {
          if (elem !== this.head) {
            if (first) while (selectedFiles[0]) selectedFiles[0].classList.remove("selected");
            elem.classList.toggle("selected");
          }
        }
    var singleSelect = (elem) => {
          if (elem !== this.head) {
            while (selectedFiles[0]) selectedFiles[0].classList.remove("selected");
            elem.classList.add("selected");
            var location = elem.getAttribute("href");
            if (!qrFolder.isDir(location)) {
              this.dispatchEvent(new CustomEvent("fileselected", {
                detail: {
                  fileElem: elem
                }
              }));
            }
            var {top, bottom} = elem.getBoundingClientRect();
            if (top < 0 || innerHeight - bottom < 0) elem.scrollIntoView();
          }
        }
    this.addEventListener("click", ((first) => event => {
      var target = event.target;
      if (!isFileElem(target)) return;
      if (target.contentEditable === "plaintext-only") return;
      if (event.ctrlKey || event.metaKey) {
        toggleSelect(target, first);
        if (first) first = false;
      } else {
        singleSelect(target);
        if (!first) first = true;
      }
    })(true));
    var deepIntoFile = async (location, toOpen) => {
          var dirs = qrFolder.dirArr(location),
              setUpEvent = new CustomEvent("click"),
              queue = new qr.Queue;
          setUpEvent.ctrlKey = !toOpen;
          for (let i = 0; i < dirs.length; i++) {
            var fnum, folder;
            fnum = fileReference.get(dirs[i]),
            folder = fileGallery[fnum];
            if (i === 0) folder = this;
            if (!folder) return;
            if (folder.settedUp !== true) {
              folder.addEventListener("settedUp", () => {
                queue.resolve();
              });
              if (folder.initiated !== true) {
                folder.addEventListener("initiated", () => {
                  folder.head.dispatchEvent(setUpEvent);
                });
              } else {
                folder.head.dispatchEvent(setUpEvent);
              }
              await queue;
            } else if (toOpen) {
              if (!folder.classList.contains("opened")) {
                folder.head.dispatchEvent(setUpEvent);
              }
            }
          }
          queue.resolve(fileGallery[fileReference.get(location)]);
          return queue;
        };
    this.deepIntoFile = deepIntoFile;
    this.selectFile = (fnum, location) => {
      var file = fileGallery[fnum];
      if (file && this.contains(file)) {
        var folder = file.closest("qr-folder");
        while (folder !== this) {
          if (!folder.classList.contains("opened")) folder.head.click();
          folder = folder.parentNode.closest("qr-folder");
        }
        deepIntoFile(location, true).catch(error => console.log(error));
        singleSelect(file);
      } else if (location) {
        deepIntoFile(location, true).then(file => {
          if (file) singleSelect(file);
        }).catch(error => {
          console.log(error);
        });
      }
    };
    var dragBox = qrFolder.createElement("div", {
          class: "dragBox",
          draggable: "true"
        }), dragItem = qrFolder.createElement("div", {
          class: "dragItem"
        }), isSingleFile = (elem) => {
          return (
            !elem.classList.contains("selected") ||
            selectedFiles.length === 1 && selectedFiles[0] === elem
          );
        }
    dragBox.appendChild(dragItem);
    dragBox.addEventListener("dragstart", event => {
      var target = document.activeElement;
      if (isFileElem(target) && target.contentEditable !== "plaintext-only") {
        if (isSingleFile(target)) {
          dragItem.innerText = target.innerText;
          event.dataTransfer.setData("text", target.href);
        } else {
          dragItem.innerText = selectedFiles.length + " items";
          var data = "";
          for (let elem of selectedFiles)
            data += elem.href +  "\n";
          event.dataTransfer.setData("text", data.trim());
        }
        dragBox.style.opacity = 1;
        setTimeout(() => {
          dragBox.remove();
          dragBox.style.opacity = 0;
        });
      } else {
        dragBox.remove();
        dragBox.style.opacity = 0;
      }
    });
    this.addEventListener("click", event => {
      event.preventDefault();
    }, true);
    this.addEventListener("pointerdown", event => {
      var target = event.target
      if (!isFileElem(target)) return;
      target.setPointerCapture(event.pointerId);
      target.onlostpointercapture = () => {
        dragBox.remove();
        dragBox.style.opacity = 0;
      };
      this.append(dragBox);
      dragBox.style.left = event.clientX - 2 + "px";
      dragBox.style.top = event.clientY - 2 + "px";
    });
    var dragOnElement, openCanceled = false, openDragOn = qr.lastCall(() => {
          if (
            dragOnElement?.classList.contains("dir-title") && !openCanceled &&
            !dragOnElement.parentNode.classList.contains("opened")
          ) dragOnElement.click();
        }, 1000);
    var sortedOutSrc = (flag = true) => {
          var fileElem = document.activeElement,
              locations, filesToHandle;
          if (!isFileElem(fileElem)) return false;
          if (isSingleFile(fileElem)) filesToHandle = [fileElem];
          else filesToHandle = [...selectedFiles];
          if (flag) for (let i = 0; i < filesToHandle.length; i++)
            filesToHandle[i].classList.remove("selected");
          locations = filesToHandle.map(elem => elem.getAttribute("href"));
          var folderSrcs = locations.filter((location) => {
                return qrFolder.isDir(location);
              }), locations2 = [...locations];
          for (let i = 0, folderSrc; i < folderSrcs.length; i++) {
            folderSrc = folderSrcs[i];
            for (let ii = 0, location; ii < locations.length; ii++) {
              location = locations[ii];
              if (folderSrc !== location && location.indexOf(folderSrc) === 0) {
                var index = locations2.indexOf(location);
                if (index !== -1) locations2.splice(index, 1);
              }
            }
          }
          return locations2;
        }
    var canDrop = (elems, elem2) => {
          if (!isFileElem(elems)) return false;
          if (elem2.classList.contains("dir-body")) {
            elem2 = elem2.parentNode.head;
          } else if (!isFileElem(elem2)) return false;
          var newLocation = qrFolder.dirname(elem2.getAttribute("href"));
          if (isSingleFile(elems)) elems = [elems];
          else elems = [...selectedFiles];
          var locations = elems.map((elem) => {
                return elem.getAttribute("href");
              });
          for (let i = 0, location; i < locations.length; i++) {
            location = locations[i];
            if (
              qrFolder.dirname(location, true) === newLocation || 
              qrFolder.isDir(location) && newLocation.indexOf(location) === 0
            ) return false;
          }
          return true;
        }
    this.addEventListener("dragover", event => {
      event.preventDefault();
    });
    this.addEventListener("dragenter", event => {
      var target = event.target, filestomove = document.activeElement;
      event.preventDefault();
      dragOnElement = target;
      if (canDrop(filestomove, target)) {
        target.closest("qr-folder").classList.add("draggedOn");
        openCanceled = false;
        openDragOn();
      }
    });
    this.addEventListener("dragleave", event => {
      var target = event.target;
      dragOnElement = event.relatedTarget;
      if (!dragOnElement || dragOnElement.closest("qr-folder") !==
          target.closest("qr-folder")) {
        target.closest("qr-folder").classList.remove("draggedOn")
      }
    });
    this.addEventListener("drop", event => {
      var target = event.target, folder;
      openCanceled = true;
      if (!canDrop(document.activeElement, target)) return;
      if (folder = target.closest("qr-folder")) {
        folder.classList.remove("draggedOn");
        rootFolder.request("moveFiles", "json", {
          locations: JSON.stringify(sortedOutSrc(false)),
          location: folder.src
        }).then((result) => {
          var error = result.error;
          if (error) messageBox.postMessage(error);
          else handleResponse(result);
        }, (error) => {
          console.log(error);
        });
      }
    });
    var contextMenu = qrFolder.createElement("div", {
          class: "context-menu"
        }), rename = qrFolder.createElement("a", {
          class: "rename"
        }, "Rename"), refresh = qrFolder.createElement("a", {
          class: "refresh"
        }, "Refresh"), nFile = qrFolder.createElement("a", {
          class: "nFile"
        }, "New File"), nFolder = qrFolder.createElement("a", {
          class: "nFolder"
        }, "New Folder"), zFile = qrFolder.createElement("a", {
          class: "zFile"
        }, "Compress"), eFile = qrFolder.createElement("a", {
          class: "eFile"
        }, "Extract"), ulFile = qrFolder.createElement("a", {
          class: "ulFile"
        }, "Upload"), dlFile = qrFolder.createElement("a", {
          class: "dlFile"
        }, "Download"), dFile = qrFolder.createElement("a", {
          class: "dFile"
        }, "Delete"), removeContextMenu = () => {
          if (this.contains(contextMenu)) {
            contextMenu.innerHTML = "";
            contextMenu.remove();
          }
        }
    var refreshRequest = HttpRequest(),
        cleanGarbage = (file) => {
          while (file = fileGarbage.pop()) {
            let curFile = file, fnum = curFile.fnum;
            refreshRequest("searchFiles", "json", {inode: fnum}).then(response => {
              var filepath = response.filepath;
              if (filepath) deepIntoFile(filepath).catch(error => console.log(error));
              else {
                if (curFile.tagName === "QR-FOLDER") {
                  (function removeFolder(folder) {
                    var subFiles = folder.querySelectorAll(".dir-body > *");
                    for (let fileElem of subFiles) {
                      let location;
                      if (location = fileElem.getAttribute("href")) {
                        delete fileGallery[fileElem.fnum];
                        fileReference.delete(location);
                      } else if (location = fileElem.src) {
                        removeFolder(fileElem);
                      }
                    }
                    delete fileGallery[folder.fnum];
                    fileReference.delete(folder.src);
                  })(curFile);
                  this.dispatchEvent(new CustomEvent("folderdeleted", {
                    detail: {
                      fileElem: curFile
                    }
                  }));
                } else {
                  delete fileGallery[fnum];
                  fileReference.delete(curFile.getAttribute("href"));
                  this.dispatchEvent(new CustomEvent("filedeleted", {
                    detail: {
                      fileElem: curFile
                    }
                  }));
                }
              }
            }, error => console.log(error)).catch(error => console.log(error));
          }
        }, updateHandler = (subFolders) => {
          for (let i = 0; i < subFolders.length - 1; i++) {
            refreshRequest("getFiles", "json", {location: subFolders[i].src}).then((response) => {
              if (response.error) throw response.error;
              subFolders[i].refresh(response);
            }, error => console.log(error)).catch(error => console.log(error));
          }
          refreshRequest("getFiles", "json", {location: subFolders[subFolders.length - 1].src}).then((response) => {
            if (response.error) throw response.error;
            subFolders[subFolders.length - 1].refresh(response);
            cleanGarbage();
          }, error => {
            console.log(error);
            cleanGarbage();
          }).catch(error => {
            console.log(error);
            cleanGarbage();
          });
        }, refreshFolder =  qr.lastCall(() => {
          var subFolders = this.querySelectorAll("qr-folder");
          refreshRequest("getFiles", "json", {location: this.src}).then((response) => {
            if (response.error) throw response.error;
            this.refresh(response);
          }, error => {
            console.log(error);
            cleanGarbage();
            this.dispatchEvent(new CustomEvent("error", {detail: `Error: refreach failed`}))
          }).then(inError => {
            if (subFolders.length && !inError) {
              updateHandler(subFolders);
            } else {
              cleanGarbage();
            }
          }).catch(error => {
            console.log(error);
            cleanGarbage();
            this.dispatchEvent(new CustomEvent("error", {detail: `Error: refreach failed`}));
          });
        }, 100);
    var renameKeydown = function (event) {
          var key = event.key;
          if ("\\/:*?\"<>|".indexOf(key) !== -1) event.preventDefault();
          if (key === "Enter") {
            event.preventDefault();
            this.blur();
          }
        }, renameBlur = function blur() {
          var location = this.getAttribute("href"), fname = this.innerText.trim();
          this.innerText = fname;
          if (!fname) this.innerText = qrFolder.baseName(this.getAttribute("href"));
          else if (fname !== qrFolder.baseName(location)) {
            rootFolder.request("renameFiles", "json", {
              location, fname
            }).then((result) => {
              var error = result.error;
              if (error) {
                messageBox.postMessage(error);
                this.innerText = this.innerText = qrFolder.baseName(this.getAttribute("href"));
              } else handleResponse(result);
            }, (error) => {
              console.log(error);
            });
          }
          this.removeAttribute("contenteditable");
          this.removeEventListener("keydown", renameKeydown);
          this.removeEventListener("blur", blur);
        }, renameFile = () => {
          var fileElem = document.activeElement,
              selection = document.getSelection(),
              fileName = fileElem.innerText,
              index = fileName.lastIndexOf(".");
          if (fileElem.classList.contains("dir-title") || index === -1) index = fileName.length;
          selection.empty();
          selection.setBaseAndExtent(fileElem.childNodes[0], 0, fileElem.childNodes[0], index);
          fileElem.addEventListener("keydown", renameKeydown);
          fileElem.addEventListener("blur", renameBlur);
          fileElem.contentEditable = "plaintext-only";
        }, fileTemplate = qrFolder.createElement("a", {
          class: "qr-file",
          contentEditable: "plaintext-only"
        });
    var createNewFile = () => {
          var fileElem = document.activeElement,
              folder = fileElem.parentNode,
              body = folder.body;
          if(!folder.classList.contains("opened")) fileElem.click();
          var anchor = [...body.children].find(child => child.classList.contains("qr-file"));
          if (anchor) anchor.before(fileTemplate);
          else body.append(fileTemplate);
          fileTemplate.innerHTML = "";
          fileTemplate.href = "";
          fileTemplate.contentEditable = "plaintext-only";
          fileTemplate.focus();
        }, folderTemplate = qrFolder.createElement("a", {
          class: "dir-title",
          contentEditable: "plaintext-only"
        });
    var createNewFolder = () => {
          var fileElem = document.activeElement,
              folder = fileElem.parentNode,
              body = folder.body;
          if(!folder.classList.contains("opened")) fileElem.click();
          folderTemplate.innerHTML = "";
          folderTemplate.setAttribute("src", "");
          folderTemplate.contentEditable = "plaintext-only";
          body.prepend(folderTemplate);
          folderTemplate.focus();
        };
    var deleteFiles = () => {
          var fileElem = document.activeElement, location = fileElem.getAttribute("href"),
              locations = sortedOutSrc(false);
          qrFolder.dialog.confirm("Are you sure to delete the following files?", locations.join("<br>")).then(yes => {
            if (yes) {
              rootFolder.request("deleteFiles", "json", {
                locations: JSON.stringify(locations)
              }).then((result) => {
                var error = result.error;
                if (error) messageBox.postMessage(error);
                else handleResponse(result);
              }, (error) => {
                console.log(error);
              });
            }
          });
        };
    var zipFiles = () => {
          var fileElem = document.activeElement, location = fileElem.getAttribute("href");
          rootFolder.request("zipFiles", "json", {
            locations: JSON.stringify(sortedOutSrc()),
            location
          }).then((result) => {
            var error = result.error;
            if (error) messageBox.postMessage(error);
            else handleResponse(result);
          }, (error) => {
            console.log(error);
          });
        };
    var extractFiles = () => {
          var fileElem = document.activeElement, location = fileElem.getAttribute("href");
          rootFolder.request("extractFiles", "json", {
            location
          }).then((result) => {
            var error = result.error;
            if (error) messageBox.postMessage(error);
            else handleResponse(result);
          }, (error) => {
            console.log(error);
          });
        };
    var fileData = new FormData(),
        uploader = qr.createElement("input", {type: "file", multiple: ""}),
        uploadFiles = () => {
          uploader.click();
        };
    var downloader = qrFolder.createElement("a", {download: ""}),
        downloadFiles = () => {
          var fileElem = document.activeElement;
          if (qrFolder.isDir(location)) {} else {
            downloader.href = fileElem.href;
            downloader.click();
          }
        }
    fileTemplate.addEventListener("keydown", renameKeydown);
    fileTemplate.addEventListener("click", event => event.preventDefault());
    fileTemplate.addEventListener("blur", () => {
      var folder = fileTemplate.closest("qr-folder"),
          location = folder.src,
          fname = fileTemplate.innerText.trim();
      if (fname) {
        rootFolder.request("createFiles", "json", {
          location, fname
        }).then((result) => {
          var error = result.error;
          if (error) {
            messageBox.postMessage(error);
            fileTemplate.remove();
          } else handleResponse(result);
        }, (error) => {
          console.log(error);
          fileTemplate.remove();
        });
        fileTemplate.removeAttribute("contenteditable");
        fileTemplate.href = location + fname;
        fileTemplate.innerText += "...";
      } else fileTemplate.remove();
    });
    folderTemplate.addEventListener("keydown", renameKeydown);
    folderTemplate.addEventListener("blur", () => {
      var folder = folderTemplate.closest("qr-folder"),
          location = folder.src,
          fname = folderTemplate.innerText.trim();
      if (fname) {
        rootFolder.request("createFolders", "json", {
          location,
          fname
        }).then((result) => {
          var error = result.error;
          if (error) {
            messageBox.postMessage(error);
            folderTemplate.remove();
          } else handleResponse(result);
        }, (error) => {
          console.log(error);
          folderTemplate.remove();
        });
        folderTemplate.removeAttribute("contenteditable");
        folderTemplate.setAttribute("src", location + fname + "/");
        folderTemplate.innerText += "...";
      } else {
        folderTemplate.remove();
      }
    });
    uploader.addEventListener("input", async () => {
      var fileElem = document.activeElement;
      for (let fileToUpload of uploader.files) {
        fileData.set("filetoupload", fileToUpload);
        try {
          let response = await fetch(new URL(window.location.pathname + 
            "api.php?" + "action=uploadFiles&location=" + 
            fileElem.parentNode.src, origin), {
            method: "POST",
            body: fileData
          }).then(function (header) {
            return header.text();
          });
          try {
            let result = JSON.parse(response);
            if (result.error) messageBox.postMessage(error);
            else handleResponse(result);
          } catch (error) {
            qrFolder.dialog.alert(response);
          }
        } catch (error) {
          console.log(error);
        }
      }
      uploader.value = "";
    });
    contextMenu.addEventListener("pointerdown", event => event.preventDefault());
    contextMenu.addEventListener("click", event => {
      var target = event.target;
      switch (target) {
        case rename: renameFile(); break;
        case refresh: refreshFolder(); break;
        case nFile: createNewFile(); break;
        case nFolder: createNewFolder(); break;
        case zFile: zipFiles(); break;
        case eFile: extractFiles(); break;
        case ulFile: uploadFiles(); break;
        case dlFile: downloadFiles(); break;
        case dFile: deleteFiles(); break;
      }
      removeContextMenu();
    });
    this.addEventListener("contextmenu", event => {
      event.preventDefault();
      var target = event.target, classList = target?.classList;
      if (document.activeElement !== target) return;
      if (!classList || target === fileTemplate || target === folderTemplate) return;
      if (classList.contains("dir-title") && target !== this.head) {
        contextMenu.append(rename, nFile, nFolder, zFile, ulFile, dFile);
        this.append(contextMenu);
      } else if (classList.contains("qr-file")) {
        if (qrFolder.getExtention(target.getAttribute("href")) === "zip")
          contextMenu.append(rename, eFile, dlFile, dFile);
        else
          contextMenu.append(rename, zFile, dlFile, dFile);
        this.append(contextMenu);
      } else if (classList.contains("dir-body") || target === this.head) {
        contextMenu.append(refresh, nFile, nFolder, ulFile);
        this.append(contextMenu);
      }
      var newTop = event.clientY, newLeft = event.clientX, 
          height = contextMenu.offsetHeight, width = contextMenu.offsetWidth;
      if (innerHeight - (newTop + height) < 0) newTop = newTop - height;
      if (innerWidth - (newLeft + width) < 0) newLeft = newLeft - width;
      contextMenu.style.left = newLeft + "px";
      contextMenu.style.top = newTop + "px";
    });
    if (this.ontouchstart === null) this.addEventListener("touchstart", event => {
      var touches = event.touches;
      if (touches.length === 2) {
        let target = document.activeElement, classList = target?.classList;
        if (!classList || target === fileTemplate || target === folderTemplate) return;
        if (classList.contains("dir-title") && target !== this.head) {
          contextMenu.append(rename, nFile, nFolder, zFile, ulFile, dFile);
          this.append(contextMenu);
        } else if (classList.contains("qr-file")) {
          if (qrFolder.getExtention(target.getAttribute("href")) === "zip")
            contextMenu.append(rename, eFile, dlFile, dFile);
          else
            contextMenu.append(rename, zFile, dlFile, dFile);
          this.append(contextMenu);
        } else if (classList.contains("dir-body") || target === this.head) {
          contextMenu.append(refresh, nFile, nFolder, ulFile);
          this.append(contextMenu);
        }
        let {y: newTop, x: newLeft} = target.getBoundingClientRect(),
        height = contextMenu.offsetHeight, width = contextMenu.offsetWidth;
        if (!this.contains(contextMenu)) return;
        newTop += 12;
        newLeft += this.offsetWidth - 12;
        if (innerHeight - (newTop + height) < 0) newTop = newTop - height;
        if (innerWidth - (newLeft + width) < 0) newLeft = newLeft - width;
        contextMenu.style.left = newLeft + "px";
        contextMenu.style.top = newTop + "px";
      }
    });
    this.addEventListener("focusout", removeContextMenu);
    this.addEventListener("pointerdown", event => {
      if (this.contains(contextMenu) && event.button === 0) {
        if (!contextMenu.contains(event.target)) {
          this.addEventListener("click", event => {
            event.stopPropagation();
          }, {once: true, capture: true});
          removeContextMenu();
        }
      }
    });
    this.addEventListener("settedUp", () => {
      this.scrollBar = qrFolder.createElement("qr-slidery");
      this.append(this.scrollBar);
      this.scrollBar.linkElement(this.body);
      this.addEventListener("resize", function () {
        this.body.updateScroll();
      });
    });
    this.getFileInode = (location) => request("getInode", "json", {location});
    if (!this.src) this.src = "/";
  }
  static isDir(a) {
    if (!a?.length) return;
    return a[a.length-1] === "/";
  }
  static baseName(a) {
    var Arr = a.split("/");
    return Arr[Arr.length-1] || Arr[Arr.length-2];
  }
  static dirname(a, b) {
    if (b) a = a.slice(0, a.length - 1);
    var index = a.lastIndexOf("/");
    if (index === -1) return "./";
    return a.slice(null, index + 1);
  }
  static getExtention(a) {
    var index = a.lastIndexOf(".");
    if (index === -1) return "";
    return a.slice(index + 1).toLowerCase();
  }
  static dirArr(dir) {
    var location = dir, index = 0, Arr = [];
    while (index !== -1) {
      Arr.push(location.substr(0, index + 1));
      index = location.indexOf("/", index + 1);
    }
    return Arr.slice(this.rootFolder.src.match(/\//g).length - 1);
  }
  static createElement(tagName, attribute={}, text="") {
    var elem = document.createElement(tagName);
    for (let attr in attribute) {
      elem.setAttribute(attr, attribute[attr]);
    }
    elem.innerHTML = text;
    return elem;
  }
  static rootFolder = null;
  static origin = origin + this.dirname(location.pathname);
  static dialog = qrFolder.createElement("qr-dialog");
}
customElements.define("qr-folder", qrFolder);
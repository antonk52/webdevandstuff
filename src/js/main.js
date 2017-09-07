(function() {
  "use strict";

  var makeImagesResponsive = function() {
    var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      images = document.getElementsByTagName("body")[0].getElementsByTagName("img"),
      pixelRatio = window.devicePixelRatio ? window.devicePixelRatio >= 1.2 ? 1 : 0 : 0,
      i,
      hasAttributeFunc;

    if (images.length === 0) {
      return;
    }

    hasAttributeFunc = images[0].hasAttribute ? function(screenWidth, images) {
      return screenWidth.hasAttribute(images);
    } : function(screenWidth, images) {
      return screenWidth.getAttribute(images) !== null;
    };

    for (i = 0; i < images.length; i++) {

      var img = images[i],
        dataSrcBase2xOrSrc = pixelRatio && hasAttributeFunc(img, "data-src2x") ? "data-src2x" : "data-src",
        dataSrcBase2xOrSrcBase = pixelRatio && hasAttributeFunc(img, "data-src-base2x") ? "data-src-base2x" : "data-src-base";

      img.onload = function(q) {
        this.style.opacity = '1';
      };

      if (!hasAttributeFunc(img, dataSrcBase2xOrSrc)) continue;

      var a = hasAttributeFunc(img, dataSrcBase2xOrSrcBase) ? img.getAttribute(dataSrcBase2xOrSrcBase) : "",
        arrOfImgUrls = img.getAttribute(dataSrcBase2xOrSrc).split(",");

      for (var c = 0; c < arrOfImgUrls.length; c++) {
        var h = arrOfImgUrls[c].replace(":", "||").split("||"),
          p = h[0],
          d = h[1],
          v, m;

        if (p.indexOf("<") !== -1) {
          v = p.split("<");

          if (arrOfImgUrls[c - 1]) {
            var g = arrOfImgUrls[c - 1].split(/:(.+)/),
              y = g[0].split("<");
            m = screenWidth <= v[1] && screenWidth > y[1];
          } else m = screenWidth <= v[1];

        } else {
          v = p.split(">");

          if (arrOfImgUrls[c + 1]) {
            var b = arrOfImgUrls[c + 1].split(/:(.+)/),
              w = b[0].split(">");
            m = screenWidth >= v[1] && screenWidth < w[1];
          } else m = screenWidth >= v[1];
        }

        if (m) {
          var E = d.indexOf("//") !== -1 ? 1 : 0,
            S;
          E === 1 ? S = d : S = a + d;
          img.src !== S && img.setAttribute("src", S);
          break;
        }
      }
    }
  };

  function headerBackground() {
    var sizes = [{w:360,h:150}, {w:720, h:300}, {w:1440, h:600}];
    var header = document.getElementById('masthead');
    var imgName = header.dataset.background;
    var headerSize = header.getBoundingClientRect();
    // by default pick the largest
    var size = '1920x800';
    // check which size we will be using
    for (var i = 0, l = sizes.length; i < l; i++) {
      var s = sizes[i];
      if (headerSize.width <= s.w && headerSize.height <= s.h) {
        size = '' + s.w + 'x' + s.h;
        break;
      }
    }
    var bg = 'url(' + imgName + '-' + size + '.jpg)';
    header.style.backgroundImage = bg;
  }

  function navigation() {
    var container, button, menu;

    container = document.getElementById('site-navigation');
    if (!container)
      return;

    button = container.getElementsByTagName('h1')[0];
    if ('undefined' === typeof button)
      return;

    menu = container.getElementsByTagName('ul')[0];

    // Hide menu toggle button if menu is empty and return early.
    if ('undefined' === typeof menu) {
      button.style.display = 'none';
      return;
    }

    if (-1 === menu.className.indexOf('nav-menu'))
      menu.className += ' nav-menu';

    button.onclick = function() {
      if (-1 !== container.className.indexOf('toggled'))
        container.className = container.className.replace(' toggled', '');
      else
        container.className += ' toggled';
    };
  }

  function each(arr, callback) {
    for (var i = 0, arrOfImgUrls = arr.length; i < arrOfImgUrls; i++) {
      callback(arr[i]);
    }
  }

  function revealProjectInfo() {
    var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      workModals = document.getElementsByClassName('work-modal');

    if (workModals.length) {

      if (screenWidth < 700) {

        each(workModals, function(el) {
          el.style.display = 'none';
          if (el.classList.contains('visible')) {
            el.classList.remove('visible');
          }
        });

      } else {

        each(workModals, function(el) {
          el.removeAttribute('style');
        });
        var sample = document.getElementById('work-modal-sample');
        sample.classList.add('visible');
        sample.attributes.style = '';

        var links = document.querySelectorAll('li > a.work-link');
        each(links, function(el) {
          el.addEventListener('mouseover', function(screenWidth) {
            sample.classList.remove('visible');
            var dat = screenWidth.target.attributes['data-id'].value;
            document.getElementById('work-modal-m-' + dat).classList.add('visible');
          });
        });
        each(links, function(el) {
          el.addEventListener('mouseout', function(screenWidth) {
            var dat = screenWidth.target.attributes['data-id'].value;
            document.getElementById('work-modal-m-' + dat).classList.remove('visible');
          });
        });
      }
    }
  }

  if (document.readyState === 'complete' || document.readyState !== 'loading') {
    onLoad();
  } else {
    document.addEventListener('DOMContentLoaded', onLoad);
  }

  function onLoad() {
    headerBackground();
    makeImagesResponsive();
    navigation();
    //antonk52 stuff
    window.addEventListener('resize', function() {
      revealProjectInfo();
    });

    revealProjectInfo();
  }

})();


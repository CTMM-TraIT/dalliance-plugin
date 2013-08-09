/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// domui.js: SVG UI components
//

Browser.prototype.removeAllPopups = function() {
    removeChildren(this.hPopupHolder);
    removeChildren(this.popupHolder);
}

Browser.prototype.makeTooltip = function(ele, text)
{
    var isin = false;
    var thisB = this;
    var timer = null;
    var outlistener;
    outlistener = function(ev) {
        isin = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        ele.removeEventListener('mouseout', outlistener, false);
    };

    var setup;
    setup = function(ev) {
        var mx = ev.clientX + window.scrollX, my = ev.clientY + window.scrollY;

        if (!timer) {
            timer = setTimeout(function() {
                var popup = makeElement('div',
                    [makeElement('div', null, {className: 'tooltip-arrow'}),
                     makeElement('div', text, {className: 'tooltip-inner'})], 
                    {className: 'tooltip bottom in'}, {
                    display: 'block',
                    top: '' + (my + 20) + 'px',
                    left: '' + Math.max(mx - 30, 20) + 'px'
                });
                thisB.hPopupHolder.appendChild(popup);
                var moveHandler;
                moveHandler = function(ev) {
                    try {
                        thisB.hPopupHolder.removeChild(popup);
                    } catch (e) {
                        // May have been removed by other code which clears the popup layer.
                    }
                    window.removeEventListener('mousemove', moveHandler, false);
                    if (isin) {
                        if (ele.offsetParent == null) {
                            // dlog('Null parent...');
                        } else {
                            setup(ev);
                        }
                    }
                }
                window.addEventListener('mousemove', moveHandler, false);
                timer = null;
            }, 1000);
        }
    };

    ele.addEventListener('mouseover', function(ev) {
        isin = true
        ele.addEventListener('mouseout', outlistener, false);
        setup(ev);
    }, false);
    ele.addEventListener('DOMNodeRemovedFromDocument', function(ev) {
        isin = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }, false);
}


function getOffsetRect(el) {
    // (1)
    var box = el.getBoundingClientRect()

    var body = document.body
    var docElem = document.documentElement

    // (2)
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

    // (3)
    var clientTop = docElem.clientTop || body.clientTop || 0
    var clientLeft = docElem.clientLeft || body.clientLeft || 0

    // (4)
    var top  = box.top +  scrollTop - clientTop
    var left = box.left + scrollLeft - clientLeft

    return { y: Math.round(top), x: Math.round(left) }
}


Browser.prototype.popit = function(ev, name, ele, opts)
{


    var thisB = this;
    if (!opts) {
        opts = {};
    }

    var width = opts.width || 200;


    var dalInstance = document.getElementById('dallianceBrowser');
    var dalPos = getOffsetRect(dalInstance);

// ==========================================
// Original code to return the mouse position
// ==========================================
//    var mx =  ev.clientX, my = ev.clientY;
//    mx +=  document.documentElement.scrollLeft || document.body.scrollLeft;
//    my +=  document.documentElement.scrollTop || document.body.scrollTop;
//    var winWidth = window.innerWidth;
//
//    var top = (my + 30) - dalPos.y;
//    var left = (Math.min((mx - 30), (winWidth - width - 10))) - dalPos.x;

    var winWidth = window.innerWidth;

    // return the mouse position (x & y)
    function myHandleEvent(e){
        var evt = e ? e:window.event;
        var clickX=0, clickY=0;

        if ((evt.clientX || evt.clientY) &&
            document.body &&
            document.body.scrollLeft!=null) {
            clickX = evt.clientX + document.body.scrollLeft;
            clickY = evt.clientY + document.body.scrollTop;
        }
        if ((evt.clientX || evt.clientY) &&
            document.compatMode=='CSS1Compat' &&
            document.documentElement &&
            document.documentElement.scrollLeft!=null) {
            clickX = evt.clientX + document.documentElement.scrollLeft;
            clickY = evt.clientY + document.documentElement.scrollTop;
        }
        if (evt.pageX || evt.pageY) {
            clickX = evt.pageX;
            clickY = evt.pageY;
        }
        return {x:clickX, y:clickY};
    }

    var mouseClick = myHandleEvent(ev);

    var top = mouseClick.y;
    var left = mouseClick.x - (width/2);

    var popup = makeElement('div');
    popup.className = 'popover fade bottom in';
    popup.style.display = 'block';
    popup.style.position = 'absolute';
    popup.style.top = '' + top + 'px';
    popup.style.left = '' + left + 'px';
    popup.style.width = width + 'px';
    if (width > 276) {
        // HACK Bootstrappification...
        popup.style.maxWidth = width + 'px';
    }

    popup.appendChild(makeElement('div', null, {className: 'arrow'}));

    if (name) {
        var closeButton = makeElement('button', '', {className: 'close'});
        closeButton.innerHTML = '&times;'

        closeButton.addEventListener('mouseover', function(ev) {
            closeButton.style.color = 'red';
        }, false);
        closeButton.addEventListener('mouseout', function(ev) {
            closeButton.style.color = 'black';
        }, false);
        closeButton.addEventListener('mousedown', function(ev) {
            thisB.removeAllPopups();
        }, false);
        var tbar = makeElement('h3', [makeElement('span', name, null, {maxWidth: '200px'}), closeButton], {className: 'popover-title'}, {});

        var dragOX, dragOY;
        var moveHandler, upHandler;
        moveHandler = function(ev) {
            ev.stopPropagation(); ev.preventDefault();
            left = left + (ev.clientX - dragOX);
            if (left < 8) {
                left = 8;
            } if (left > (winWidth - width - 32)) {
                left = (winWidth - width - 26);
            }
            top = top + (ev.clientY - dragOY);
            top = Math.max(10, top);
            popup.style.top = '' + top + 'px';
            popup.style.left = '' + Math.min(left, (winWidth - width - 10)) + 'px';
            dragOX = ev.clientX; dragOY = ev.clientY;
        }
        upHandler = function(ev) {
            ev.stopPropagation(); ev.preventDefault();
            window.removeEventListener('mousemove', moveHandler, false);
            window.removeEventListener('mouseup', upHandler, false);
        }
        tbar.addEventListener('mousedown', function(ev) {
            ev.preventDefault(); ev.stopPropagation();
            dragOX = ev.clientX; dragOY = ev.clientY;
            window.addEventListener('mousemove', moveHandler, false);
            window.addEventListener('mouseup', upHandler, false);
        }, false);
                              

        popup.appendChild(tbar);
    }

    popup.appendChild(makeElement('div', ele, {className: 'popover-content'}, {
        padding: '10px'
    }));
    this.hPopupHolder.appendChild(popup);

    var popupHandle = {
        node: popup,
        displayed: true
    };
    popup.addEventListener('DOMNodeRemoved', function(ev) {
        popupHandle.displayed = false;
    }, false);
    return popupHandle;
}

function dlog(msg) {
    console.log(msg);
}
